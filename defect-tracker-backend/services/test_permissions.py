import unittest
from unittest.mock import patch
from services.permissions import get_action_permissions

class TestGetActionPermissions(unittest.TestCase):

    @patch('services.permissions.UserPermission')
    @patch('services.permissions.UserActionPermission')
    def test_get_action_permissions_create(self, mock_user_action_permission, mock_user_permission):
        mock_user_action_permission.side_effect = lambda action: action
        mock_user_permission.query.filter_by.return_value.count.return_value = 1
        
        result = get_action_permissions('test@example.com')
        
        self.assertTrue(result['can_create'])
        self.assertFalse(result['can_edit'])

    @patch('services.permissions.UserPermission')
    @patch('services.permissions.UserActionPermission')
    def test_get_action_permissions_edit(self, mock_user_action_permission, mock_user_permission):
        mock_user_action_permission.side_effect = lambda action: action
        mock_user_permission.query.filter_by.return_value.count.return_value = 0
        
        result = get_action_permissions('test@example.com')
        
        self.assertFalse(result['can_create'])
        self.assertFalse(result['can_edit'])

if __name__ == '__main__':
    unittest.main()