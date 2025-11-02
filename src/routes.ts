import { Router } from 'express';
import authRoute from './app/modules/auth/auth.route';
import userRoute from './app/modules/user/user.route';
import { productRoutes } from './app/modules/products/products.route';
import { OrderRoute } from './app/modules/order/order.route';
import { CartRoute } from './app/modules/cart/cart.route';
import { PromotionRoute } from './app/modules/promotion/promotion.route';
import { supportRoutes } from './app/modules/supports/support.route';
import { paymentRoutes } from './app/modules/payment/payment.route'
import { notificationRoutes } from './app/modules/notifications/notification.route';
import { withlistProductsRoutes } from './app/modules/wishListedProducts/wishListedProducts.route';
import { RequestRefundRoutes } from './app/modules/requestRefund/requestRefund.route'
import { categoryRoute } from './app/modules/category/category.route';
import { subscriptionRoutes } from './app/modules/subscriptions/subscription.route';
import path from 'path';


const appRouter = Router();

const moduleRoutes = [
    { path: '/auth', route: authRoute },
    { path: "/user", route: userRoute },
    { path: "/category", route: categoryRoute },
    { path: "/product", route: productRoutes },
    { path: "/cart", route: CartRoute },
    { path: "/order", route: OrderRoute },
    { path: "/promotion", route: PromotionRoute },
    { path: "/support", route: supportRoutes},
    { path: "/payment", route: paymentRoutes },
    { path: "/notification", route: notificationRoutes },
    { path: "/wishListProducts", route: withlistProductsRoutes },
    { path: "/request-refund", route: RequestRefundRoutes },
    { path: "/subscription-plan", route: subscriptionRoutes },


];

moduleRoutes.forEach(route => appRouter.use(route.path, route.route));
export default appRouter;