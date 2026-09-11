from django.test import TestCase
from django.urls import reverse


class RootEndpointTests(TestCase):
    def test_root_endpoint_returns_success(self):
        response = self.client.get(reverse("home"))

        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
