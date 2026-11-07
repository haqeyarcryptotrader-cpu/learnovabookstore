# Learnovabookstore

Build a complete, responsive Afghan Online Bookstore named "Learnova Books Store" designed for both Soft Copy (PDF) and Hard Copy book sales.

Core Features:
1. Book Catalog & Categories:
   - Showcase books with cover image, title, author, price in AFN (Afghani) and USD, and categories (Tech & AI, Crypto & Finance, Self-Help, Islamic & History, Literature).
   - Clear visual badges on each book: "Hard Copy Available" / "Digital PDF Available" or both.
   - Search bar and filtering by category and format (Hard Copy, Soft Copy, All).
2. Product Details & Purchase Options:
   - Format selector for each book: "Hard Copy" (physical delivery) vs "Soft Copy" (instant PDF download / digital delivery).
   - For Hard Copy: Quick checkout collecting buyer Name, WhatsApp/Phone, City/Province (Kabul, Herat, Mazar, Kandahar, Jalalabad, etc.), Delivery Address, with an 'Order via WhatsApp' button pre-formatting the exact book title, format, price, and customer details.
   - For Soft Copy: Digital purchase flow with sample preview/download capability, payment instructions (HesabPay, Hawala, Sarai Shahzada / USDT crypto transfer), and WhatsApp receipt verification button.
3. Cart & Orders:
   - Floating shopping cart supporting multi-book orders, calculating total in AFN and USD.
   - Checkout modal supporting cash-on-delivery for hard copies and direct digital delivery for soft copies.
4. Admin / Management Panel:
   - Client-side admin view (with toggle or dedicated route) to easily add, edit, or delete books (Title, Author, Hard Copy Price, Soft Copy Price, Category, Cover Image URL, Description, In-Stock status, PDF link).
5. Design & User Experience:
   - Elegant, modern, bookstore aesthetic with dark/light theme toggle, clean typography, responsive mobile-first navigation.
   - RTL/Pashto/Dari and English welcoming banner or toggle.
   - Pre-populate with 6-8 realistic book titles with covers (including crypto, tech, business, and literature) so the store is immediately functional, engaging, and ready to publish.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://learnovabookstore.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9bbde76c-cc4a-4cee-bf5f-a0f28e5c60d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
