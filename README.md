# ABIS_proCRM-backend
This is the backend for the ABIS-pro CRM.

```
ABIS-Pro-Backend
├─ .prettierrc
├─ jest.config.js
├─ nodemon.json
├─ package-lock.json
├─ package.json
├─ README.md
├─ src
│  ├─ configs
│  │  └─ sequelize.ts
│  ├─ controllers
│  │  ├─ Auth
│  │  │  └─ userController.ts
│  │  ├─ Calling
│  │  │  └─ callingController.ts
│  │  ├─ Customer
│  │  │  ├─ customerController.ts
│  │  │  ├─ customerFeedbackController.ts
│  │  │  ├─ CustomerInfoController.ts
│  │  │  ├─ orderController.ts
│  │  │  ├─ orderItemController.ts
│  │  │  └─ productController.ts
│  │  ├─ Dashboard
│  │  │  └─ dashboardController.ts
│  │  └─ Form
│  │     ├─ FormController.ts
│  │     ├─ queryTypeController.ts
│  │     └─ supportTypeController.ts
│  ├─ index.ts
│  ├─ libs
│  │  └─ awsS3.ts
│  ├─ middlewares
│  │  ├─ auth.ts
│  │  ├─ errorHandler.ts
│  │  └─ upload.ts
│  ├─ models
│  │  ├─ Auth
│  │  │  ├─ Employee.ts
│  │  │  └─ EmployeeRole.ts
│  │  ├─ Calling
│  │  │  └─ Call.ts
│  │  ├─ Customer
│  │  │  ├─ Customer.ts
│  │  │  ├─ CustomerFeedback.ts
│  │  │  ├─ Enquiry.ts
│  │  │  ├─ Feedback.ts
│  │  │  ├─ Order.ts
│  │  │  ├─ OrderItem.ts
│  │  │  ├─ Product.ts
│  │  │  └─ Promotion.ts
│  │  ├─ Form
│  │  │  ├─ FormDetail.ts
│  │  │  ├─ QueryType.ts
│  │  │  └─ SupportType.ts
│  │  └─ index.ts
│  ├─ routes
│  │  ├─ Auth
│  │  │  └─ userRoutes.ts
│  │  ├─ Calling
│  │  │  └─ callingRoutes.ts
│  │  ├─ Customer
│  │  │  ├─ customerFeedbackRoutes.ts
│  │  │  ├─ customerInfoRoutes.ts
│  │  │  ├─ customerRoutes.ts
│  │  │  ├─ orderItemRoutes.ts
│  │  │  ├─ orderRoutes.ts
│  │  │  └─ productRoutes.ts
│  │  ├─ Dashboard
│  │  │  └─ dashboardRoutes.ts
│  │  └─ Form
│  │     ├─ formRoutes.ts
│  │     ├─ queryTypeRoutes.ts
│  │     └─ supportTypeRoutes.ts
│  ├─ scripts
│  │  └─ seed.ts
│  └─ utils
│     ├─ AppError.ts
│     └─ asyncHandler.ts
├─ tests
│  ├─ basic.test.ts
│  ├─ customer
│  │  └─ customer.api.test.ts
│  ├─ helpers
│  │  └─ loginAndGetCookie.ts
│  ├─ setup.ts
│  ├─ setupEnv.ts
│  └─ user
│     └─ user.api.test.ts
└─ tsconfig.json

```