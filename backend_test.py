import requests
import unittest
import json
import time

class SatAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super(SatAPITester, self).__init__(*args, **kwargs)
        self.base_url = "https://432d1c92-7ce2-462a-bce4-c21674f5fd7d.preview.emergentagent.com/api"
        self.token = None
        self.customer_email = f"customer_{int(time.time())}@test.com"
        self.restaurant_email = f"restaurant_{int(time.time())}@test.com"
        self.password = "testpass123"
        self.customer_id = None
        self.restaurant_id = None
        self.customer_token = None
        self.restaurant_token = None
        self.box_id = None
        self.restaurant_profile_id = None

    def test_01_health_check(self):
        """Test the health check endpoint"""
        print("\n🔍 Testing health check endpoint...")
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "Sät API is running")
        self.assertEqual(data["status"], "healthy")
        print("✅ Health check endpoint is working")

    def test_02_register_customer(self):
        """Test customer registration"""
        print("\n🔍 Testing customer registration...")
        payload = {
            "name": "Test Customer",
            "email": self.customer_email,
            "password": self.password,
            "role": "customer"
        }
        response = requests.post(f"{self.base_url}/auth/register", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["role"], "customer")
        self.customer_id = data["user"]["id"]
        self.customer_token = data["access_token"]
        print(f"✅ Customer registration successful with email: {self.customer_email}")

    def test_03_register_restaurant(self):
        """Test restaurant registration"""
        print("\n🔍 Testing restaurant registration...")
        payload = {
            "name": "Test Restaurant",
            "email": self.restaurant_email,
            "password": self.password,
            "role": "restaurant"
        }
        response = requests.post(f"{self.base_url}/auth/register", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["role"], "restaurant")
        self.restaurant_id = data["user"]["id"]
        self.restaurant_token = data["access_token"]
        print(f"✅ Restaurant registration successful with email: {self.restaurant_email}")

    def test_04_duplicate_email(self):
        """Test registration with duplicate email"""
        print("\n🔍 Testing duplicate email registration...")
        payload = {
            "name": "Duplicate User",
            "email": self.customer_email,  # Using the same email as before
            "password": self.password,
            "role": "customer"
        }
        response = requests.post(f"{self.base_url}/auth/register", json=payload)
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Email already registered")
        print("✅ Duplicate email check is working")

    def test_05_customer_login(self):
        """Test customer login"""
        print("\n🔍 Testing customer login...")
        payload = {
            "email": self.customer_email,
            "password": self.password
        }
        response = requests.post(f"{self.base_url}/auth/login", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["role"], "customer")
        self.customer_token = data["access_token"]
        print("✅ Customer login successful")

    def test_06_restaurant_login(self):
        """Test restaurant login"""
        print("\n🔍 Testing restaurant login...")
        payload = {
            "email": self.restaurant_email,
            "password": self.password
        }
        response = requests.post(f"{self.base_url}/auth/login", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("access_token", data)
        self.assertIn("user", data)
        self.assertEqual(data["user"]["role"], "restaurant")
        self.restaurant_token = data["access_token"]
        print("✅ Restaurant login successful")

    def test_07_invalid_login(self):
        """Test login with invalid credentials"""
        print("\n🔍 Testing invalid login credentials...")
        payload = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        response = requests.post(f"{self.base_url}/auth/login", json=payload)
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Invalid credentials")
        print("✅ Invalid login check is working")

    def test_08_auth_me_customer(self):
        """Test protected endpoint with customer token"""
        print("\n🔍 Testing protected endpoint with customer token...")
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["role"], "customer")
        self.assertEqual(data["email"], self.customer_email)
        print("✅ Protected endpoint with customer token is working")

    def test_09_auth_me_restaurant(self):
        """Test protected endpoint with restaurant token"""
        print("\n🔍 Testing protected endpoint with restaurant token...")
        headers = {"Authorization": f"Bearer {self.restaurant_token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["role"], "restaurant")
        self.assertEqual(data["email"], self.restaurant_email)
        print("✅ Protected endpoint with restaurant token is working")

    def test_10_auth_me_invalid_token(self):
        """Test protected endpoint with invalid token"""
        print("\n🔍 Testing protected endpoint with invalid token...")
        headers = {"Authorization": "Bearer invalidtoken"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)
        data = response.json()
        self.assertIn("detail", data)
        self.assertEqual(data["detail"], "Invalid token")
        print("✅ Protected endpoint with invalid token check is working")

    def test_11_create_restaurant_profile(self):
        """Test creating a restaurant profile"""
        print("\n🔍 Testing restaurant profile creation...")
        headers = {"Authorization": f"Bearer {self.restaurant_token}"}
        payload = {
            "name": "Test Restaurant",
            "description": "A test restaurant for API testing",
            "address": "Алматы, Казахстан",
            "phone": "+7 (777) 123-4567"
        }
        response = requests.post(f"{self.base_url}/restaurants", json=payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["name"], "Test Restaurant")
        self.restaurant_profile_id = data["id"]
        print("✅ Restaurant profile creation successful")

    def test_12_get_restaurant_profile(self):
        """Test getting restaurant profile"""
        print("\n🔍 Testing get restaurant profile...")
        headers = {"Authorization": f"Bearer {self.restaurant_token}"}
        response = requests.get(f"{self.base_url}/restaurants/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["name"], "Test Restaurant")
        print("✅ Get restaurant profile successful")

    def test_13_create_food_box(self):
        """Test creating a food box"""
        print("\n🔍 Testing food box creation...")
        headers = {"Authorization": f"Bearer {self.restaurant_token}"}
        payload = {
            "title": "Test Food Box",
            "description": "A test food box for API testing",
            "category": "Выпечка",
            "quantity": 2,
            "price_before": 3000,
            "price_after": 1000,
            "pickup_time": "18:00-20:00"
        }
        response = requests.post(f"{self.base_url}/boxes", json=payload, headers=headers)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["title"], "Test Food Box")
        self.box_id = data["id"]
        print(f"✅ Food box creation successful with ID: {self.box_id}")

    def test_14_get_restaurant_boxes(self):
        """Test getting restaurant's boxes"""
        print("\n🔍 Testing get restaurant boxes...")
        headers = {"Authorization": f"Bearer {self.restaurant_token}"}
        response = requests.get(f"{self.base_url}/boxes/my", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertTrue(any(box["id"] == self.box_id for box in data))
        print("✅ Get restaurant boxes successful")

    def test_15_get_all_boxes(self):
        """Test getting all boxes as customer"""
        print("\n🔍 Testing get all boxes...")
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = requests.get(f"{self.base_url}/boxes", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        # Verify our test box is in the list
        self.assertTrue(any(box["id"] == self.box_id for box in data))
        print("✅ Get all boxes successful")

    def test_16_add_to_favorites(self):
        """Test adding a box to favorites"""
        print("\n🔍 Testing add to favorites...")
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = requests.post(f"{self.base_url}/favorites/{self.box_id}", headers=headers)
        self.assertEqual(response.status_code, 201)
        print("✅ Add to favorites successful")

    def test_17_get_favorites(self):
        """Test getting favorites"""
        print("\n🔍 Testing get favorites...")
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = requests.get(f"{self.base_url}/favorites", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        # Verify our test box is in favorites
        self.assertTrue(any(fav["box_id"] == self.box_id for fav in data))
        print("✅ Get favorites successful")

    def test_18_remove_from_favorites(self):
        """Test removing a box from favorites"""
        print("\n🔍 Testing remove from favorites...")
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = requests.delete(f"{self.base_url}/favorites/{self.box_id}", headers=headers)
        self.assertEqual(response.status_code, 200)
        print("✅ Remove from favorites successful")

    def test_19_verify_removed_from_favorites(self):
        """Verify box was removed from favorites"""
        print("\n🔍 Testing verify removal from favorites...")
        headers = {"Authorization": f"Bearer {self.customer_token}"}
        response = requests.get(f"{self.base_url}/favorites", headers=headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Verify our test box is not in favorites
        self.assertFalse(any(fav["box_id"] == self.box_id for fav in data))
        print("✅ Verify removal from favorites successful")

if __name__ == "__main__":
    # Run the tests in order
    test_suite = unittest.TestSuite()
    test_suite.addTest(SatAPITester('test_01_health_check'))
    test_suite.addTest(SatAPITester('test_02_register_customer'))
    test_suite.addTest(SatAPITester('test_03_register_restaurant'))
    test_suite.addTest(SatAPITester('test_04_duplicate_email'))
    test_suite.addTest(SatAPITester('test_05_customer_login'))
    test_suite.addTest(SatAPITester('test_06_restaurant_login'))
    test_suite.addTest(SatAPITester('test_07_invalid_login'))
    test_suite.addTest(SatAPITester('test_08_auth_me_customer'))
    test_suite.addTest(SatAPITester('test_09_auth_me_restaurant'))
    test_suite.addTest(SatAPITester('test_10_auth_me_invalid_token'))
    test_suite.addTest(SatAPITester('test_11_create_restaurant_profile'))
    test_suite.addTest(SatAPITester('test_12_get_restaurant_profile'))
    test_suite.addTest(SatAPITester('test_13_create_food_box'))
    test_suite.addTest(SatAPITester('test_14_get_restaurant_boxes'))
    test_suite.addTest(SatAPITester('test_15_get_all_boxes'))
    test_suite.addTest(SatAPITester('test_16_add_to_favorites'))
    test_suite.addTest(SatAPITester('test_17_get_favorites'))
    test_suite.addTest(SatAPITester('test_18_remove_from_favorites'))
    test_suite.addTest(SatAPITester('test_19_verify_removed_from_favorites'))
    
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)