# WAPTEK COMPUTER SERVICES Role Guide

This marketplace uses five roles. Every protected dashboard must be accessed only by the matching role.

## Admin

The admin controls the full marketplace and is not limited to one branch. Admins can view all branches, users, vendors, products, categories, orders, payment receipts, repair requests, inventory, analytics, and sales reports. Admins approve or reject vendors and can manage global marketplace operations.

## Manager

The manager controls daily operations for one assigned branch. A manager must have `profiles.branch_id` set. Managers view only their branch, including branch products, orders, payment receipt visibility, repair requests, inventory, branch reports, and cashiers assigned to that branch. Managers cannot create admins, manage global settings, approve vendors globally, or view private data from other branches.

## Cashier

The cashier handles payment confirmation for one assigned branch. A cashier must have `profiles.branch_id` set. Cashiers view pending payment receipts and orders for their branch, open receipt files, confirm payment, reject payment, and update payment-related order status. Cashiers cannot approve vendors, add products, manage users, manage branches, view global analytics, or access other branch receipts.

## Vendor

The vendor is an approved seller. Vendors can use the vendor dashboard, add and edit their own products, upload product images, manage their own inventory, and view orders containing their own products. Vendors cannot view other vendors’ orders, edit other vendors’ products, confirm payments, approve vendors, manage users, access staff dashboards, or view company-wide analytics.

## Customer

Customers are buyers. Customers can browse and search products without login, add products to cart as guests, register or log in for checkout, upload payment receipts, view their own orders, use wishlist/reviews, and request repair service. Customers cannot access staff/vendor dashboards, confirm payments, upload products unless approved as vendors, or view other customers’ orders.

## Branch Visibility

- Admin: all branches.
- Manager: assigned branch only.
- Cashier: assigned branch only.
- Vendor: own products and orders containing own products only.
- Customer: own orders only.

If a user has no valid profile role, the app should show: “Your account profile is incomplete. Please contact support.”
