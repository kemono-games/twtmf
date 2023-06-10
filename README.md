# Twtmf

Means Tw_____ the mother f__ker

## Commands

```sh
yarn dev # For running the code in development thanks to swc and nodemon

yarn test # For running unit test
yarn test:watch # For watching unit test

yarn lint # For linting the code
yarn lint:fix # For linting the code and fix issues

yarn build # For building the code (there is no typechecking due to swc compiler)
yarn type-check # For typechecking the code

yarn start:cjs # For running the code builded in cjs
yarn start:esm # For running the code builded in esm
```

## Publish to npm

Set `NPM_TOKEN` in your Github actions secret, and that's it :)

![Alt Text](https://raw.githubusercontent.com/maxgfr/typescript-swc-starter/main/.github/assets/token.png)

To test this package, just do that :

```ts
import { sayHello } from 'typescript-swc-starter';
sayHello();
```
