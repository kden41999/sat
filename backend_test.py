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
    
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(test_suite)