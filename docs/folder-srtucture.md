my-clean-ts-app/
├── src/
│ ├── main.ts # Application entry point
│ ├── presentation/ # Presentation layer (HTTP)
│ │ ├── fastify/ # Fastify-specific code
│ │ │ ├── app.ts
│ │ │ ├── server.ts
│ │ │ ├── plugins/
│ │ │ │ ├── index.ts
│ │ │ │ ├── Auth.ts
│ │ │ │ └── Swagger.ts
│ │ │ └── middleware/
│ │ │ ├── index.ts
│ │ │ └── Validation.ts
│ │ ├── controllers/ # HTTP controllers (thin adapters)
│ │ │ ├── index.ts
│ │ │ ├── UserController.ts
│ │ │ ├── ProductController.ts
│ │ │ └── BaseController.ts
│ │ ├── routes/ # Route definitions
│ │ │ ├── index.ts
│ │ │ ├── UserRoutes.ts # ✅ PascalCase consistency
│ │ │ └── ProductRoutes.ts
│ │ ├── mappers/ # ✅ Request/Response mappers only
│ │ │ ├── index.ts
│ │ │ ├── UserMapper.ts # Maps HTTP req/res to DTOs
│ │ │ └── ProductMapper.ts
│ │ ├── schemas/ # Validation schemas
│ │ │ ├── index.ts
│ │ │ ├── UserSchemas.ts # ✅ PascalCase consistency
│ │ │ └── ProductSchemas.ts
│ │ └── types/ # Presentation types
│ │ ├── index.ts
│ │ ├── Http.ts
│ │ └── Validation.ts
│ ├── application/ # Application layer
│ │ ├── interfaces/ # Application interfaces
│ │ │ ├── index.ts
│ │ │ ├── repositories/
│ │ │ │ ├── IUserRepository.ts
│ │ │ │ └── IProductRepository.ts
│ │ │ ├── services/
│ │ │ │ ├── IEmailService.ts
│ │ │ │ └── IPaymentService.ts
│ │ │ └── usecases/
│ │ │ ├── ICreateUser.ts
│ │ │ └── IUpdateUser.ts
│ │ ├── usecases/ # Use case implementations
│ │ │ ├── index.ts
│ │ │ ├── user/
│ │ │ │ ├── CreateUser.ts
│ │ │ │ ├── UpdateUser.ts
│ │ │ │ ├── DeleteUser.ts
│ │ │ │ └── GetUser.ts
│ │ │ └── product/
│ │ │ ├── CreateProduct.ts
│ │ │ └── UpdateProduct.ts
│ │ ├── services/ # Application services
│ │ │ ├── index.ts
│ │ │ ├── UserService.ts
│ │ │ └── ProductService.ts
│ │ ├── dto/ # ✅ Single source of DTOs
│ │ │ ├── index.ts
│ │ │ ├── user/
│ │ │ │ ├── CreateUserDTO.ts
│ │ │ │ ├── UpdateUserDTO.ts
│ │ │ │ └── UserResponseDTO.ts
│ │ │ └── product/
│ │ │ ├── CreateProductDTO.ts
│ │ │ └── ProductResponseDTO.ts
│ │ └── types/ # Application types
│ │ ├── index.ts
│ │ ├── Usecases.ts
│ │ └── Services.ts
│ ├── domain/ # Domain layer (business logic)
│ │ ├── user/ # ✅ Aggregate-based organization
│ │ │ ├── User.ts # Entity
│ │ │ ├── UserAggregate.ts # Aggregate root
│ │ │ ├── valueObjects/
│ │ │ │ ├── Email.ts
│ │ │ │ └── UserId.ts
│ │ │ ├── events/ # ✅ Events close to aggregate
│ │ │ │ ├── UserCreated.ts
│ │ │ │ └── UserUpdated.ts
│ │ │ ├── services/
│ │ │ │ └── UserDomainService.ts
│ │ │ └── exceptions/
│ │ │ └── UserNotFoundError.ts
│ │ ├── product/
│ │ │ ├── Product.ts
│ │ │ ├── ProductAggregate.ts
│ │ │ ├── valueObjects/
│ │ │ │ └── Money.ts
│ │ │ ├── events/
│ │ │ │ └── ProductCreated.ts
│ │ │ └── services/
│ │ │ └── ProductDomainService.ts
│ │ ├── shared/ # Shared domain concepts
│ │ │ ├── BaseEntity.ts
│ │ │ ├── BaseEvent.ts
│ │ │ └── DomainError.ts
│ │ └── types/ # Domain types
│ │ ├── index.ts
│ │ ├── Entities.ts
│ │ ├── ValueObjects.ts
│ │ └── Events.ts
│ ├── infrastructure/ # Infrastructure layer
│ │ ├── persistence/ # Data persistence
│ │ │ ├── index.ts
│ │ │ ├── mongodb/
│ │ │ │ ├── Connection.ts
│ │ │ │ ├── models/
│ │ │ │ │ ├── UserModel.ts
│ │ │ │ │ └── ProductModel.ts
│ │ │ │ └── repositories/
│ │ │ │ ├── UserRepository.ts
│ │ │ │ └── ProductRepository.ts
│ │ │ └── redis/
│ │ │ ├── Connection.ts
│ │ │ └── CacheRepository.ts
│ │ ├── external/ # External services
│ │ │ ├── index.ts
│ │ │ ├── email/
│ │ │ │ ├── EmailService.ts
│ │ │ │ └── Types.ts
│ │ │ └── payment/
│ │ │ ├── PaymentService.ts
│ │ │ └── Types.ts
│ │ ├── messaging/ # ✅ Clear separation
│ │ │ ├── index.ts
│ │ │ ├── EventBus.ts
│ │ │ ├── publishers/ # Event publishers
│ │ │ │ ├── index.ts
│ │ │ │ ├── UserEventPublisher.ts
│ │ │ │ └── ProductEventPublisher.ts
│ │ │ ├── consumers/ # Event consumers
│ │ │ │ ├── index.ts
│ │ │ │ ├── EmailNotificationConsumer.ts
│ │ │ │ └── AuditLogConsumer.ts
│ │ │ └── handlers/ # Message handlers
│ │ │ ├── index.ts
│ │ │ ├── UserEventHandler.ts
│ │ │ └── ProductEventHandler.ts
│ │ ├── config/ # Infrastructure config
│ │ │ ├── index.ts
│ │ │ ├── Database.ts
│ │ │ └── Redis.ts
│ │ └── types/ # Infrastructure types
│ │ ├── index.ts
│ │ ├── Database.ts
│ │ └── External.ts
│ ├── shared/ # Shared utilities
│ │ ├── types/ # Global shared types
│ │ │ ├── index.ts
│ │ │ ├── Common.ts
│ │ │ ├── Api.ts
│ │ │ └── Config.ts
│ │ ├── utils/ # Utility functions
│ │ │ ├── index.ts
│ │ │ ├── Logger.ts
│ │ │ ├── Validation.ts
│ │ │ └── Crypto.ts
│ │ ├── constants/ # Application constants
│ │ │ ├── index.ts
│ │ │ ├── Errors.ts
│ │ │ └── HttpStatus.ts
│ │ └── exceptions/ # Base exceptions
│ │ ├── index.ts
│ │ ├── AppError.ts
│ │ └── ValidationError.ts
│ └── config/ # Application configuration
│ ├── index.ts
│ ├── Environment.ts
│ └── Container.ts # DI container
├── tests/ # ✅ Mirror src structure
│ ├── setup.ts
│ ├── globalSetup.ts
│ ├── helpers/
│ │ ├── index.ts
│ │ ├── TestUtils.ts
│ │ └── Fixtures.ts
│ ├── unit/ # ✅ Mirror src/ structure
│ │ ├── application/
│ │ │ ├── usecases/
│ │ │ │ ├── user/
│ │ │ │ │ ├── CreateUser.test.ts
│ │ │ │ │ └── UpdateUser.test.ts
│ │ │ │ └── product/
│ │ │ └── services/
│ │ ├── domain/
│ │ │ ├── user/
│ │ │ │ ├── User.test.ts
│ │ │ │ └── UserAggregate.test.ts
│ │ │ └── product/
│ │ ├── infrastructure/
│ │ │ ├── persistence/
│ │ │ ├── external/
│ │ │ └── messaging/
│ │ └── shared/
│ │ ├── utils/
│ │ └── exceptions/
│ ├── integration/
│ │ ├── api/
│ │ │ ├── UserRoutes.test.ts
│ │ │ └── ProductRoutes.test.ts
│ │ ├── database/
│ │ │ ├── UserRepository.test.ts
│ │ │ └── ProductRepository.test.ts
│ │ └── external/
│ │ ├── EmailService.test.ts
│ │ └── PaymentService.test.ts
│ └── e2e/
│ ├── scenarios/
│ │ ├── UserWorkflow.test.ts
│ │ └── ProductWorkflow.test.ts
│ └── fixtures/
│ ├── UserFixtures.ts
│ └── ProductFixtures.ts
├── scripts/
├── docs/
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
