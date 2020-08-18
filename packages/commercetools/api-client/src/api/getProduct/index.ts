import { ProductQueryResult } from './../../types/GraphQL';
import getProduct from './api';
interface ProductData {
  products: ProductQueryResult;
}

export default getProduct;
