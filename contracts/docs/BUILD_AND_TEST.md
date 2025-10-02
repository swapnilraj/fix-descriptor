# Build and Test Guide

## Prerequisites

### Required Tools

1. **Foundry** - Ethereum development framework
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Node.js** - For TypeScript test data generation
   ```bash
   # Version 18+ required
   node --version
   ```

3. **npm** - Node package manager
   ```bash
   npm --version
   ```

## Project Structure

```
fixdescriptorkit-evm/
├── contracts/              # Solidity contracts
│   ├── src/               # Source contracts
│   │   ├── generated/     # Auto-generated test data (gitignored)
│   │   ├── examples/      # Example implementations
│   │   ├── FixCBORReader.sol
│   │   ├── FixValueParser.sol
│   │   └── FixMerkleVerifier.sol
│   ├── test/              # Solidity tests
│   ├── docs/              # Contract documentation
│   └── foundry.toml       # Foundry configuration
└── packages/
    └── fixdescriptorkit-typescript/
        ├── src/           # TypeScript implementation
        └── scripts/       # Code generation scripts
```

## Initial Setup

### 1. Install Dependencies

```bash
# Clone the repository
git clone <repo-url>
cd fixdescriptorkit-evm

# Install Foundry dependencies (submodules)
forge install

# Install TypeScript dependencies
cd packages/fixdescriptorkit-typescript
npm install
cd ../..
```

### 2. Generate Test Data

⚠️ **Important:** Generated test data is gitignored and must be created locally.

```bash
cd packages/fixdescriptorkit-typescript
npm run generate-test-data
```

This creates:
- `contracts/src/generated/GeneratedCBORTestData.sol` - CBOR test descriptors
- `contracts/src/generated/GeneratedMerkleData.sol` - Merkle roots and proofs

## Building

### Compile Contracts

```bash
# From repository root
forge build --root contracts

# Or if you're in the contracts/ directory
forge build
```

**Expected output:**
```
[⠊] Compiling...
[⠒] Compiling 25 files with Solc 0.8.28
[⠢] Solc 0.8.28 finished in 580.99ms
Compiler run successful!
```

### Clean Build

```bash
# Remove build artifacts
forge clean --root contracts

# Rebuild from scratch
forge build --root contracts
```

## Testing

### Run All Tests

```bash
# From repository root
forge test --root contracts

# Or from contracts/ directory
forge test
```

**Expected output:**
```
Ran 5 test suites in 120ms: 77 tests passed, 0 failed, 0 skipped (77 total tests)
```

### Run Specific Test Suite

```bash
# CBOR Parser tests (21 tests)
forge test --root contracts --match-contract FixCBORReaderTest

# Merkle Verifier tests (25 tests)
forge test --root contracts --match-contract GasComparisonTest

# Bond example tests (10 tests)
forge test --root contracts --match-contract BondDescriptorReaderTest
```

### Run Specific Test

```bash
# Run a single test by name
forge test --root contracts --match-test test_Gas_RealWorld_CBOR_Symbol

# Run tests matching pattern
forge test --root contracts --match-test "test_Gas.*Merkle"
```

### Verbose Output

```bash
# Show test traces
forge test --root contracts -vv

# Show execution traces
forge test --root contracts -vvv

# Show stack traces (very verbose)
forge test --root contracts -vvvv
```

## Gas Analysis

### Generate Gas Report

```bash
# Full gas report for all tests
forge test --root contracts --gas-report

# Gas report for specific contract
forge test --root contracts --match-contract GasComparisonTest --gas-report
```

**Sample output:**
```
| Contract          | Function               | Gas     |
|-------------------|------------------------|---------|
| FixCBORReader     | getField (2 fields)    | 12,933  |
| FixCBORReader     | getField (16 fields)   | 80,260  |
| FixMerkleVerifier | verify (2 fields)      | 6,085   |
| FixMerkleVerifier | verify (16 fields)     | 8,561   |
```

### Compare CBOR vs Merkle

Run the comprehensive gas comparison:

```bash
forge test --root contracts --match-contract GasComparisonTest --gas-report > gas_report.txt
```

View results:
```bash
cat gas_report.txt | grep -E "test_Gas"
```

**Expected comparison:**
- CBOR: 12k-80k gas (scales with descriptor size)
- Merkle: 6k-8.5k gas (constant)
- **Savings: 2-10x** ✅

See [GAS_COMPARISON.md](GAS_COMPARISON.md) for detailed analysis.

### Analyze Specific Field Access

```bash
# Compare Symbol field access across different descriptors
forge test --root contracts --match-test ".*Symbol" --gas-report

# Output shows:
# - test_Gas_Simple_CBOR_Symbol: 12,933 gas
# - test_Gas_Simple_Merkle_Symbol: 6,085 gas
# - test_Gas_RealWorld_CBOR_Symbol: 80,260 gas
# - test_Gas_RealWorld_Merkle_Symbol: 8,561 gas
```

## Code Coverage

### Generate Coverage Report

```bash
# Run coverage analysis
forge coverage --root contracts

# Generate detailed HTML report
forge coverage --root contracts --report lcov
genhtml lcov.info --output-directory coverage
open coverage/index.html
```

### Coverage for Specific Files

```bash
# Coverage for CBOR Reader
forge coverage --root contracts --match-path "src/FixCBORReader.sol"

# Coverage for Merkle Verifier
forge coverage --root contracts --match-path "src/FixMerkleVerifier.sol"
```

## Debugging

### Debug Failing Test

```bash
# Run with maximum verbosity
forge test --root contracts --match-test test_name -vvvv

# Use debugger
forge test --root contracts --match-test test_name --debug
```

### Inspect Storage

```bash
# Run test and show storage changes
forge test --root contracts --match-test test_name -vvv --show-storage
```

### Gas Snapshots

```bash
# Create gas snapshot
forge snapshot --root contracts

# Compare with previous snapshot
forge snapshot --root contracts --diff .gas-snapshot
```

## Continuous Integration

### CI Test Command

```bash
# Run all checks in CI
./scripts/ci-test.sh
```

Or manually:
```bash
# 1. Generate test data
cd packages/fixdescriptorkit-typescript && npm run generate-test-data && cd ../..

# 2. Build contracts
forge build --root contracts

# 3. Run tests
forge test --root contracts

# 4. Check gas usage
forge snapshot --root contracts --check .gas-snapshot
```

## Common Issues

### Issue 1: "Generated test data not found"

**Error:**
```
Error: File not found: contracts/src/generated/GeneratedCBORTestData.sol
```

**Solution:**
```bash
cd packages/fixdescriptorkit-typescript
npm run generate-test-data
```

### Issue 2: "forge-std not found"

**Error:**
```
Error: Source "forge-std/Test.sol" not found
```

**Solution:**
```bash
# Reinstall Foundry dependencies
forge install

# Or update submodules
git submodule update --init --recursive
```

### Issue 3: Tests fail after regenerating data

**Solution:**
```bash
# Clean build cache
forge clean --root contracts

# Rebuild
forge build --root contracts

# Run tests
forge test --root contracts
```

### Issue 4: Out of gas in tests

**Error:**
```
Error: OutOfGas
```

**Solution:**
```bash
# Increase gas limit in foundry.toml
# gas_limit = "18446744073709551615"

# Or use specific gas limit for test
forge test --root contracts --gas-limit 999999999
```

## Performance Optimization

### Faster Test Runs

```bash
# Run tests in parallel (faster)
forge test --root contracts -j 4

# Skip build if contracts haven't changed
forge test --root contracts --no-build
```

### Selective Testing

```bash
# Only run gas comparison tests
forge test --root contracts --match-contract GasComparisonTest

# Skip slow tests
forge test --root contracts --no-match-test ".*RealWorld.*"
```

## Development Workflow

### Typical Development Cycle

1. **Make changes** to Solidity contracts
   ```bash
   vim contracts/src/MyContract.sol
   ```

2. **Compile** to check for errors
   ```bash
   forge build --root contracts
   ```

3. **Run tests** to verify functionality
   ```bash
   forge test --root contracts --match-contract MyContractTest
   ```

4. **Check gas** usage
   ```bash
   forge test --root contracts --match-contract MyContractTest --gas-report
   ```

5. **Update snapshots** if gas changed
   ```bash
   forge snapshot --root contracts
   ```

### When Updating Test Data

1. **Modify** test descriptors in TypeScript
   ```bash
   vim packages/fixdescriptorkit-typescript/scripts/generate-solidity-test-data.ts
   ```

2. **Regenerate** Solidity test data
   ```bash
   cd packages/fixdescriptorkit-typescript
   npm run generate-test-data
   cd ../..
   ```

3. **Rebuild** and test
   ```bash
   forge build --root contracts
   forge test --root contracts
   ```

## Next Steps

- 📖 Read [CBOR_PARSER.md](CBOR_PARSER.md) - Learn about CBOR parsing
- 📖 Read [MERKLE_VERIFIER.md](MERKLE_VERIFIER.md) - Learn about Merkle verification
- 📊 Read [GAS_COMPARISON.md](GAS_COMPARISON.md) - Understand gas trade-offs
- 💡 See [../src/examples/](../src/examples/) - Example implementations

## Help

### Get Help

```bash
# Foundry help
forge --help
forge test --help

# List all tests
forge test --root contracts --list

# Show configuration
forge config --root contracts
```

### Useful Links

- [Foundry Book](https://book.getfoundry.sh/)
- [Foundry Repository](https://github.com/foundry-rs/foundry)
- [Solidity Documentation](https://docs.soliditylang.org/)
