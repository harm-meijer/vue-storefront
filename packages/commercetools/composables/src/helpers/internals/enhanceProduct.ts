import { ApolloQueryResult } from 'apollo-client';
import { ProductQueryResult } from './../../types/GraphQL';

interface ProductData {
  products: ProductQueryResult;
}

const enhanceProduct = (productResponse: ApolloQueryResult<ProductData>): ApolloQueryResult<ProductData> => {
  (productResponse.data as any)._variants = productResponse.data.products.results
    .map((product) => {
      const current = product.masterData.current;

      return current.allVariants.map((variant) => ({
        ...variant,
        _name: current.name,
        _slug: current.slug,
        _id: product.id,
        _master: current.masterVariant.id === variant.id,
        _description: current.description,
        _categoriesRef: current.categoriesRef.map((cr) => cr.id)
      }));
    })
    .reduce((prev, curr) => [...prev, ...curr], []);

  return productResponse;
};

const enhanceProducts = (productResponse) => {
  const _variants = productResponse.results.map(
    (product) => ({
      // how to get locale?
      _name: product.name.en,
      // @todo
      _slug: product.slug.en,
      _id: product.id,
      _master: true,
      // no description in product?
      _description: '',
      _categoriesRef: product.categories.map(
        ({ id }) => id
      ),
      images: product.masterVariant.images
    })
  );

  return { ...productResponse, data: { _variants } };
};

export default (productResponse)=>
  ('facets' in productResponse)
    ? enhanceProducts(productResponse)
    : enhanceProduct(productResponse);
