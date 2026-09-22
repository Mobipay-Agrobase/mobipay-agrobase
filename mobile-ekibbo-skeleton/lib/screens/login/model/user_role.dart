enum UserRole {
  admin,
  fieldOfficer,
  farmer,
}

extension ExtUserRole on UserRole {
  String getTitle() {
    switch (this) {
      case UserRole.admin:
        return 'Admin';
      case UserRole.fieldOfficer:
        return 'Field Officer';
      case UserRole.farmer:
        return 'Farmer';
    }
  }
}
