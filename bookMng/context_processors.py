from django.urls import reverse


def sidebar_menu(request):
    menu_items = [
        {
            'name': 'Dashboard',
            'url_name': 'index',
            'icon_class': 'fas fa-th-large',
            'active_block': 'nav_dashboard_active',
            'tooltip': 'Dashboard'
        },
        {
            'name': 'Post Book',
            'url_name': 'postbook',
            'icon_class': 'fas fa-plus-square',
            'active_block': 'nav_postbook_active',
            'tooltip': 'Post Book'
        },
        {
            'name': 'Display Books',
            'url_name': 'displaybooks',
            'icon_class': 'fas fa-book-open',
            'active_block': 'nav_displaybooks_active',
            'tooltip': 'Display Books'
        },
        {
            'name': 'My Books',
            'url_name': 'mybooks',
            'icon_class': 'fas fa-address-book',
            'active_block': 'nav_mybooks_active',
            'tooltip': 'My Books',
            'login_required': True  # only show if user is logged in
        },
        {
            'name': 'Shopping Cart',
            'url_name': 'displayCart',
            'icon_class': 'fas fa-shopping-cart',
            'active_block': 'nav_shoppingcart_active',
            'tooltip': 'Shopping Cart',
            'login_required': True
        },
        {
            'name': 'Favorites',
            'url_name': 'favorites',
            'icon_class': 'fas fa-heart',
            'active_block': 'nav_favorites_active',
            'tooltip': 'Favorites',
            'login_required': True
        },
        {
            'name': 'About Us',
            'url_name': 'about',  
            'icon_class': 'fas fa-info-circle',
            'active_block': 'nav_about_active',
            'tooltip': 'About Us',
            'login_required': True
        },
    ]

    processed_menu_items = []
    for item in menu_items:
        if item.get('login_required', False) and not request.user.is_authenticated:
            continue

        try:
            item['url'] = reverse(item['url_name'])
            processed_menu_items.append(item)
        except Exception as e:
            print(f"Warning: Could not resolve URL for sidebar item '{item['name']}'")
            pass

    return {'sidebar_items': processed_menu_items}
