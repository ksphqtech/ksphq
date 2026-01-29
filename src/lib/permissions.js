export function filterNavItems(navItems, user) {
  if (!user) return []

  return navItems.filter(item => {
    // No role restriction = available to all
    if (!item.roles) return true

    // Check if user's role is in allowed roles
    return item.roles.includes(user.role)
  })
}
