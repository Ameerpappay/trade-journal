# API Services Architecture

This directory contains the API service layer for the Trade Journal application, organized by feature domains.

## Structure

```
services/
├── api/
│   ├── baseService.ts       # Base service with common request logic
│   ├── tradeService.ts      # Trade-related API calls
│   ├── strategyService.ts   # Strategy management API calls
│   ├── tagService.ts        # Tag management API calls
│   ├── uploadService.ts     # File upload API calls
│   ├── holdingService.ts    # Holdings management API calls
│   ├── symbolService.ts     # Symbol management API calls
│   ├── portfolioService.ts  # Portfolio management API calls
│   └── index.ts            # Exports and unified API service
├── index.ts                # Main service exports
└── README.md               # This file
```

## Usage

### Option 1: Use the unified API service (backward compatible)

```typescript
import { apiService } from "../services";

// Use any method as before
const trades = await apiService.getTrades();
const portfolios = await apiService.getPortfolios();
```

### Option 2: Use individual feature services (recommended for new code)

```typescript
import { tradeService, portfolioService } from "../services";

// More explicit and modular
const trades = await tradeService.getTrades();
const portfolios = await portfolioService.getPortfolios();
```

### Option 3: Import specific services directly

```typescript
import { tradeService } from "../services/api/tradeService";
import { portfolioService } from "../services/api/portfolioService";

// Direct imports for maximum tree-shaking
const trades = await tradeService.getTrades();
const portfolios = await portfolioService.getPortfolios();
```

## Benefits

1. **Separation of Concerns**: Each service handles one feature domain
2. **Better Tree Shaking**: Only import what you need
3. **Easier Testing**: Mock individual services instead of the entire API
4. **Maintainability**: Changes to one feature don't affect others
5. **Type Safety**: Better TypeScript support and intellisense
6. **Backward Compatibility**: Existing code continues to work

## Service Descriptions

- **BaseApiService**: Contains common HTTP request logic and error handling
- **TradeService**: Manages trade CRUD operations and filtering
- **StrategyService**: Handles trading strategy management
- **TagService**: Manages tags for categorization
- **UploadService**: Handles file uploads and deletions
- **HoldingService**: Manages portfolio holdings and calculations
- **SymbolService**: Manages trading symbols and bulk uploads
- **PortfolioService**: Handles portfolio management and active portfolio logic

## Migration Guide

All existing code will continue to work without changes. To gradually migrate to the new structure:

1. Replace `import { apiService } from '../../services/apiService'` with `import { apiService } from '../../services'`
2. For new code, consider using individual services: `import { tradeService } from '../../services'`
3. For maximum modularity, import directly: `import { tradeService } from '../../services/api/tradeService'`
