# result.ts

A TypeScript Take on Rust’s Result<T, E>.

## Installation

```bash
# Using npm
npm install @hicarod0/result.ts

# Using yarn
yarn add @hicarod0/result.ts

# Using pnpm
pnpm add @hicarod0/result.ts

# Using bun
bun add @hicarod0/result.ts
```

## Quick Start

```typescript
import { ok, err, Result } from '@hicarod0/result.ts';

// Create successful results
const success = ok(42);

// Create error results
const failure = err("Something went wrong");

// Check the result
if (success.isOk()) {
  console.log(success.value); // 42
}

if (failure.isErr()) {
  console.log(failure.error); // "Something went wrong"
}
```

## Core Concepts

### Checking Results

```typescript
const result = ok(100);

result.isOk();  // true
result.isErr(); // false

const error = err("failed");
error.isOk();  // false
error.isErr(); // true
```

### Transforming Values

```typescript
// map: Transform the success value
ok(5)
  .map(x => x * 2)
  .map(x => x + 1)
  .unwrap(); // 11

// mapErr: Transform the error value
err("not found")
  .mapErr(e => `Error: ${e}`)
  .err(); // "Error: not found"
```

### Chaining Operations

```typescript
// andThen: Chain operations that can fail
function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return err("division by zero");
  return ok(a / b);
}

ok(10)
  .andThen(x => divide(x, 2))  // Ok(5)
  .andThen(x => divide(x, 0))  // Err("division by zero")
  .map(x => x * 10)            // Skipped (already Err)
  .unwrapOr(0);                // 0 (fallback value)
```

### Pattern Matching

```typescript
const result = ok(42);

const message = result.switch({
  Ok: (value) => `Success: ${value}`,
  Err: (error) => `Failed: ${error}`
});

console.log(message); // "Success: 42"
```

### Extracting Values

```typescript
const result = ok(42);

result.unwrap();      // 42 (throws if Err)
result.ok();          // 42 (returns undefined if Err)
result.unwrapOr(0);   // 42 (returns default if Err)
result.err();         // undefined (returns error if Err)
```

## Real-World Examples

### 1. API Calls with Fetch

Never let network errors crash your app again.

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

async function fetchUser(userId: number): Promise<Result<User, string>> {
  try {
    const response = await fetch(`https://api.example.com/users/${userId}`);
    
    if (!response.ok) {
      return err(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const user = await response.json();
    return ok(user);
  } catch (error) {
    return err(`Network error: ${error}`);
  }
}

// Usage
const userResult = await fetchUser(123);

userResult.switch({
  Ok: (user) => console.log(`Welcome, ${user.name}!`),
  Err: (error) => console.error(`Failed to load user: ${error}`)
});
```

### 2. Form Validation

Chain multiple validations elegantly.

```typescript
interface UserInput {
  email: string;
  age: number;
}

function validateEmail(email: string): Result<string, string> {
  // TODO: use your validation method here
  return ok(email); // I'll assume it's valid
}

function validateAge(age: number): Result<number, string> {
  // TODO: use your validation method here
  return ok(age); // I'll assume it's valid
}

function validateUser(input: UserInput): Result<UserInput, string> {
  const emailResult = validateEmail(input.email);
  if (emailResult.isErr()) return err(emailResult.error);
  
  const ageResult = validateAge(input.age);
  if (ageResult.isErr()) return err(ageResult.error);
  
  return ok(input);
}

// Usage
const result = validateUser({ email: "john@example.com", age: 25 });

if (result.isOk()) {
  console.log("User validated:", result.value);
} else {
  console.log("Validation failed:", result.error);
}
```

### 3. Database Queries

Handle database errors without try-catch soup.

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

async function findProduct(id: string): Promise<Result<Product, string>> {
  try {
    const product = await db.products.findUnique({ where: { id } });
    
    if (!product) {
      return err(`Product ${id} not found`);
    }
    
    return ok(product);
  } catch (error) {
    return err(`Database error: ${error}`);
  }
}

async function updateProductPrice(
  id: string, 
  newPrice: number
): Promise<Result<Product, string>> {
  if (newPrice < 0) {
    return err("Price cannot be negative");
  }
  
  const productResult = await findProduct(id);
  
  return productResult.andThen(async (product) => {
    try {
      const updated = await db.products.update({
        where: { id },
        data: { price: newPrice }
      });
      return ok(updated);
    } catch (error) {
      return err(`Failed to update: ${error}`);
    }
  });
}

// Usage
const result = await updateProductPrice("prod-123", 99.99);

const message = result.switch({
  Ok: (product) => `Updated ${product.name} to $${product.price}`,
  Err: (error) => `Update failed: ${error}`
});
```

### 4. Configuration Loading

Parse and validate configuration safely.

```typescript
interface Config {
  apiUrl: string;
  timeout: number;
  retries: number;
}

function parseConfig(raw: string): Result<Config, string> {
  try {
    const parsed = JSON.parse(raw);
    
    if (!parsed.apiUrl || typeof parsed.apiUrl !== 'string') {
      return err("Missing or invalid apiUrl");
    }
    
    if (typeof parsed.timeout !== 'number' || parsed.timeout <= 0) {
      return err("Invalid timeout value");
    }
    
    if (typeof parsed.retries !== 'number' || parsed.retries < 0) {
      return err("Invalid retries value");
    }
    
    return ok({
      apiUrl: parsed.apiUrl,
      timeout: parsed.timeout,
      retries: parsed.retries
    });
  } catch (error) {
    return err(`JSON parse error: ${error}`);
  }
}

// Usage with fallback
const configData = fs.readFileSync('config.json', 'utf-8');
const config = parseConfig(configData).unwrapOr({
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
});
```

### 5. File Operations

Handle file I/O gracefully.

```typescript
function readFile(path: string): Result<string, string> {
  try {
    const content = fs.readFileSync(path, 'utf-8');
    return ok(content);
  } catch (error) {
    return err(`Failed to read ${path}: ${error}`);
  }
}

function writeFile(path: string, content: string): Result<void, string> {
  try {
    fs.writeFileSync(path, content, 'utf-8');
    return ok(undefined);
  } catch (error) {
    return err(`Failed to write ${path}: ${error}`);
  }
}

// Chain file operations
const result = readFile('input.txt')
  .map(content => content.toUpperCase())
  .andThen(content => writeFile('output.txt', content));

if (result.isErr()) {
  console.error("File operation failed:", result.error);
}
```

### 6. Parsing User Input

Convert and validate user input safely.

```typescript
function parsePositiveInt(input: string): Result<number, string> {
  const num = parseInt(input, 10);
  
  if (isNaN(num)) {
    return err(`"${input}" is not a valid number`);
  }
  
  if (num <= 0) {
    return err("Number must be positive");
  }
  
  return ok(num);
}

// Usage
const inputs = ["42", "-5", "abc", "100"];

inputs.forEach(input => {
  parsePositiveInt(input).switch({
    Ok: (num) => console.log(`✓ Valid: ${num}`),
    Err: (error) => console.log(`✗ Invalid: ${error}`)
  });
});

// Output:
// Valid: 42
// Invalid: Number must be positive
// Invalid: "abc" is not a valid number
// Valid: 100
```

### 7. Complex Business Logic

Chain multiple fallible operations.

```typescript
interface Order {
  id: string;
  userId: string;
  items: Array<{ productId: string; quantity: number }>;
  total: number;
}

async function processOrder(orderId: string): Promise<Result<Order, string>> {
  const orderResult = await findOrder(orderId);
  
  return orderResult
    .andThen(validateOrder)
    .andThen(checkInventory)
    .andThen(calculateTotal)
    .andThen(chargeCustomer)
    .andThen(sendConfirmation);
}

// Usage
const result = await processOrder("order-123");

result.switch({
  Ok: (order) => {
    console.log(`Order ${order.id} processed successfully`);
    console.log(`Total: $${order.total}`);
  },
  Err: (error) => {
    console.error(`Order processing failed: ${error}`);
    // Maybe send notification to customer or retry
  }
});
```

## TypeScript Tips

The library provides full type safety and type narrowing:

```typescript
const result: Result<number, string> = ok(42);

if (result.isOk()) {
  // TypeScript knows result is Ok<number, string>
  const value: number = result.value; // No type error
}

if (result.isErr()) {
  // TypeScript knows result is Err<number, string>
  const error: string = result.error; // No type error
}
```

# License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
