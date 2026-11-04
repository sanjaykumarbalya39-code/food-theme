# Cart and checkout

Open cart.html using the same static origin as Explore Menu. Add buttons on menu cards and dish details use browser storage; all header cart icons open the cart and show the current quantity.

The sample checkout supports delivery and dine-in details, quantity editing, removal, recommendations, and UPI/card/cash preference choices. WELCOME10 gives a demo 10% discount for an item subtotal of INR 300 or more, capped at INR 100. Packing is INR 20 for delivery, the sample platform fee is INR 5, delivery is INR 40 below a discounted subtotal of INR 500, and the illustrative tax is 5% of the discounted item subtotal. Dine-in has no packing or delivery fee. These are sample calculations, not verified fees or tax advice.

Place demo order creates an in-page simulation and clears the cart. No bank credentials are collected and no payment, reservation, or real order is made. Contact and address values are not stored or sent. The site remains backend-free.

Checks: node tests/cart.test.cjs and node tests/checkout.test.cjs.
