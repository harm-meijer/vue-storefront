import { ProductQueryResult } from './../../types/GraphQL';

interface ProductData {
  products: ProductQueryResult;
}

export default (productResponse) => {
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
