#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DinoInventoryAPITester:
    def __init__(self, base_url="https://dino-negocio.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tokens = {}
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test users
        self.users = {
            'deposito': {'username': 'deposito', 'password': 'admin123'},
            'negocio1': {'username': 'negocio1', 'password': 'negocio123'},
            'negocio2': {'username': 'negocio2', 'password': 'negocio123'}
        }
        
        # Test data storage
        self.test_category_id = None
        self.test_product_id = None
        self.test_order_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, role=None):
        """Make API request with optional authentication"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        if role and role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[role]}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)
            
            return response
        except Exception as e:
            print(f"Request failed: {str(e)}")
            return None

    def test_authentication(self):
        """Test authentication for all user roles"""
        print("\n🔐 Testing Authentication...")
        
        for role, credentials in self.users.items():
            response = self.make_request('POST', 'auth/login', credentials)
            
            if response and response.status_code == 200:
                data = response.json()
                if 'access_token' in data and data['role'] == role:
                    self.tokens[role] = data['access_token']
                    self.log_test(f"Login {role}", True)
                else:
                    self.log_test(f"Login {role}", False, "Invalid response format")
            else:
                status = response.status_code if response else "No response"
                self.log_test(f"Login {role}", False, f"Status: {status}")

    def test_categories_management(self):
        """Test category CRUD operations (deposito only)"""
        print("\n📂 Testing Category Management...")
        
        # Test create category (deposito)
        category_data = {"name": "Test Category"}
        response = self.make_request('POST', 'categories', category_data, 'deposito')
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data and data['name'] == "Test Category":
                self.test_category_id = data['id']
                self.log_test("Create category (deposito)", True)
            else:
                self.log_test("Create category (deposito)", False, "Invalid response format")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create category (deposito)", False, f"Status: {status}")
        
        # Test create category (negocio1 - should fail)
        response = self.make_request('POST', 'categories', category_data, 'negocio1')
        if response and response.status_code == 403:
            self.log_test("Create category (negocio1 - forbidden)", True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create category (negocio1 - forbidden)", False, f"Expected 403, got {status}")
        
        # Test get categories
        response = self.make_request('GET', 'categories', role='deposito')
        if response and response.status_code == 200:
            categories = response.json()
            if isinstance(categories, list):
                self.log_test("Get categories", True)
            else:
                self.log_test("Get categories", False, "Response not a list")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get categories", False, f"Status: {status}")
        
        # Test update category
        if self.test_category_id:
            update_data = {"name": "Updated Test Category"}
            response = self.make_request('PUT', f'categories/{self.test_category_id}', update_data, 'deposito')
            if response and response.status_code == 200:
                self.log_test("Update category", True)
            else:
                status = response.status_code if response else "No response"
                self.log_test("Update category", False, f"Status: {status}")

    def test_products_management(self):
        """Test product CRUD operations (deposito only)"""
        print("\n📦 Testing Product Management...")
        
        if not self.test_category_id:
            self.log_test("Product tests", False, "No category available for testing")
            return
        
        # Test create product (deposito)
        product_data = {
            "code": "TEST001",
            "name": "Test Product",
            "image_url": "https://images.unsplash.com/photo-1760621393386-3906922b0b78?w=400",
            "quantity": 100,
            "category_id": self.test_category_id
        }
        response = self.make_request('POST', 'products', product_data, 'deposito')
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data and data['code'] == "TEST001":
                self.test_product_id = data['id']
                self.log_test("Create product (deposito)", True)
            else:
                self.log_test("Create product (deposito)", False, "Invalid response format")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create product (deposito)", False, f"Status: {status}")
        
        # Test create product (negocio1 - should fail)
        response = self.make_request('POST', 'products', product_data, 'negocio1')
        if response and response.status_code == 403:
            self.log_test("Create product (negocio1 - forbidden)", True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create product (negocio1 - forbidden)", False, f"Expected 403, got {status}")
        
        # Test get products
        response = self.make_request('GET', 'products', role='negocio1')
        if response and response.status_code == 200:
            products = response.json()
            if isinstance(products, list):
                self.log_test("Get products (negocio1)", True)
            else:
                self.log_test("Get products (negocio1)", False, "Response not a list")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get products (negocio1)", False, f"Status: {status}")
        
        # Test update product
        if self.test_product_id:
            update_data = {"quantity": 150}
            response = self.make_request('PUT', f'products/{self.test_product_id}', update_data, 'deposito')
            if response and response.status_code == 200:
                self.log_test("Update product", True)
            else:
                status = response.status_code if response else "No response"
                self.log_test("Update product", False, f"Status: {status}")

    def test_orders_management(self):
        """Test order operations"""
        print("\n🛒 Testing Order Management...")
        
        if not self.test_product_id:
            self.log_test("Order tests", False, "No product available for testing")
            return
        
        # Test create order (negocio1)
        order_data = {
            "products": [
                {"product_id": self.test_product_id, "quantity": 5}
            ]
        }
        response = self.make_request('POST', 'orders', order_data, 'negocio1')
        
        if response and response.status_code == 200:
            data = response.json()
            if 'id' in data and data['status'] == 'pending':
                self.test_order_id = data['id']
                self.log_test("Create order (negocio1)", True)
            else:
                self.log_test("Create order (negocio1)", False, "Invalid response format")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create order (negocio1)", False, f"Status: {status}")
        
        # Test create order (deposito - should fail)
        response = self.make_request('POST', 'orders', order_data, 'deposito')
        if response and response.status_code == 403:
            self.log_test("Create order (deposito - forbidden)", True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create order (deposito - forbidden)", False, f"Expected 403, got {status}")
        
        # Test get orders (negocio1 - own orders only)
        response = self.make_request('GET', 'orders', role='negocio1')
        if response and response.status_code == 200:
            orders = response.json()
            if isinstance(orders, list):
                self.log_test("Get orders (negocio1)", True)
            else:
                self.log_test("Get orders (negocio1)", False, "Response not a list")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get orders (negocio1)", False, f"Status: {status}")
        
        # Test get orders (deposito - all orders)
        response = self.make_request('GET', 'orders', role='deposito')
        if response and response.status_code == 200:
            orders = response.json()
            if isinstance(orders, list):
                self.log_test("Get orders (deposito - all)", True)
            else:
                self.log_test("Get orders (deposito - all)", False, "Response not a list")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Get orders (deposito - all)", False, f"Status: {status}")
        
        # Test update order (negocio1)
        if self.test_order_id:
            update_data = {
                "products": [
                    {"product_id": self.test_product_id, "quantity": 3}
                ]
            }
            response = self.make_request('PUT', f'orders/{self.test_order_id}', update_data, 'negocio1')
            if response and response.status_code == 200:
                self.log_test("Update order (negocio1)", True)
            else:
                status = response.status_code if response else "No response"
                self.log_test("Update order (negocio1)", False, f"Status: {status}")
        
        # Test complete order (deposito)
        if self.test_order_id:
            response = self.make_request('PUT', f'orders/{self.test_order_id}/complete', role='deposito')
            if response and response.status_code == 200:
                self.log_test("Complete order (deposito)", True)
            else:
                status = response.status_code if response else "No response"
                self.log_test("Complete order (deposito)", False, f"Status: {status}")

    def test_stock_validation(self):
        """Test stock validation when creating orders"""
        print("\n📊 Testing Stock Validation...")
        
        if not self.test_product_id:
            self.log_test("Stock validation tests", False, "No product available for testing")
            return
        
        # Try to order more than available stock
        order_data = {
            "products": [
                {"product_id": self.test_product_id, "quantity": 1000}  # More than available
            ]
        }
        response = self.make_request('POST', 'orders', order_data, 'negocio2')
        
        # This should succeed in creating the order, validation happens on completion
        if response and response.status_code == 200:
            order_id = response.json().get('id')
            self.log_test("Create order with high quantity", True)
            
            # Try to complete order with insufficient stock
            if order_id:
                response = self.make_request('PUT', f'orders/{order_id}/complete', role='deposito')
                if response and response.status_code == 400:
                    self.log_test("Complete order - insufficient stock validation", True)
                else:
                    status = response.status_code if response else "No response"
                    self.log_test("Complete order - insufficient stock validation", False, f"Expected 400, got {status}")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Create order with high quantity", False, f"Status: {status}")

    def cleanup_test_data(self):
        """Clean up test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test product
        if self.test_product_id:
            response = self.make_request('DELETE', f'products/{self.test_product_id}', role='deposito')
            if response and response.status_code == 200:
                self.log_test("Delete test product", True)
            else:
                self.log_test("Delete test product", False, "Failed to delete")
        
        # Delete test category
        if self.test_category_id:
            response = self.make_request('DELETE', f'categories/{self.test_category_id}', role='deposito')
            if response and response.status_code == 200:
                self.log_test("Delete test category", True)
            else:
                self.log_test("Delete test category", False, "Failed to delete")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Dino Inventory Management API Tests")
        print(f"Testing against: {self.base_url}")
        
        try:
            self.test_authentication()
            
            if len(self.tokens) < 3:
                print("❌ Authentication failed for some users, stopping tests")
                return False
            
            self.test_categories_management()
            self.test_products_management()
            self.test_orders_management()
            self.test_stock_validation()
            self.cleanup_test_data()
            
            return True
            
        except Exception as e:
            print(f"❌ Test execution failed: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        print(f"\n📊 Test Summary:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "No tests run")
        
        if self.tests_passed < self.tests_run:
            print("\n❌ Failed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")

def main():
    tester = DinoInventoryAPITester()
    
    success = tester.run_all_tests()
    tester.print_summary()
    
    return 0 if success and tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())