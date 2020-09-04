/* tslint:disable */

// import { getCategory } from "../getCategory";

/* eslint-disable quotes */
import { getSettings } from './../../index';
import createAccessToken from '../../helpers/createAccessToken';

const NONE = {};
const withToken = (fn) => {
  let token = Promise.resolve(NONE);
  let retry = false;
  const request = (arg) => {
    return token.then(
      token=>token === NONE ? createAccessToken() : token
    ).then(
      t=>{
        token = Promise.resolve(t);
        return fn(arg, `Bearer ${t.access_token}`);
      }
    ).then(
      resolve=>{
        retry = false;
        return resolve;
      }
    ).catch(
      ()=>{
        if (!retry) {
          retry = true;
          token = Promise.resolve(NONE);
          return request(arg);
        }
      }
    );
  };
  return request;
};
const setCategory = ({ category, ...query }) => (category
  ? {
    ...query,
    'filter.query': `categories.id:subtree("${category}")`
  }
  : query);

const config = {
  facetSearches: [
    { name: "commonSize", type: "enum" },
    { name: "color", type: "lnum", component: "colors" },
    {
      name: "designer",
      type: "enum",
      component: "designer"
    }
  ]
};
const groupFetchJson = (a, b) => {
  return fetch(a, b).then((result) => {
    if (result.status === 401) {
      // eslint-disable-next-line no-throw-literal
      throw { statusCode: 401 };
    }
    return result.json();
  });
};
export const toUrl = (base, query) => {
  const url = new URL(base);
  query
    .reduce((result, [key, value]) => {
      if (Array.isArray(value)) {
        return result.concat(value.map((v) => [key, v]));
      }
      return result.concat([[key, value]]);
    }, [])
    .forEach(([key, val]) =>
      url.searchParams.append(key, val)
    );
  return url.toString();
};
const baseUrl =
  "https://api.commercetools.com/harm-sandbox-3";
const asAttribute = (name, type, locale) => {
  if (type === "lnum") {
    return `variants.attributes.${name}.label.${locale}`;
  }
  if (type === "enum") {
    return `variants.attributes.${name}.key`;
  }
  return `variants.attributes.${name}`;
};
export const makeConfig = (token) => ({
  headers: {
    accept: "*/*",
    authorization: token,
    "content-type": "application/json",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site"
  },
  mode: "cors"
});

const product = {
  // const {
  //   currency,
  //   country,
  //   customerGroup,
  //   channel: priceChannel
  // } = component.$store.state;
  // locale
  //  searchText
  // min and max
  // priceFilter.priceFilter = `variants.scopedPrice.value.centAmount: range (${minQ} to ${maxQ})`;

  get: withToken(
    (
      [query, locale, totalFacets = config.facetSearches],
      accessToken
    ) => {
      query = setCategory(query);
      const { currency, country } = getSettings();
      return Promise.all([
        groupFetchJson(
          toUrl(`${baseUrl}/product-projections/search`, [
            ...Object.entries(query)
              .filter(
                ([, val]) => !(val === null || val === undefined)
              ).map(
                ([k, v]) => {
                  if (k === 'priceFilter') {
                    return ['filter.query', v];
                  }
                  return [k, v];
                }
              ),
            ...totalFacets.map(
              ({ name, type }) => [
                'facet',
                `${asAttribute(name, type, locale)} counting products`
              ]
            ),
            ['priceCurrency', currency],
            ['priceCountry', country]

          ]),
          makeConfig(accessToken)
        )
      ]).then(([{ facets, results, ...result }]) => {
        return ({
          ...result,
          results: results.map(
            (product) => ({
              ...product.masterVariant,
              _name: product.name[locale],
              _slug: product.slug[locale],
              _id: product.id,
              _master: true,
              // no description in product?
              _description: '',
              _categoriesRef: product.categories.map(
                ({ id }) => id
              ),
              images: product.masterVariant.images
            })
          ),
          facets: config.facetSearches.map(
            ({ name, type }) => {
              const facet =
              facets[asAttribute(name, type, locale)];
              return {
                ...facet,
                name,
                label: "how to translate?",
                type,
                terms: [
                  ...((facet && facet.terms) || [])
                ].sort((a, b) =>
                  a.term.localeCompare(b.term)
                )
              };
            }
          )
        });
      });
    }
  )
};

export default (search) => {
  const { locale } = getSettings();
  const category = search.catId;
  const queryFacets = Object.entries(
    search.filters || ({} as any)
  )
    .map(([key, value]) => [
      key,
      ((value as any).options || [])
        .filter(({ selected }) => selected)
        .map(({ value }) => value)
    ])
    .filter(([, options]) => options.length)
    .reduce((result, [key, value]) => {
      result[key] = value;
      return result;
    }, {});
  return product
    .get([
      {
        ...queryFacets,
        category,
        pageSize: search.perPage,
        page: search.page
      },
      locale
    ])
    .then((r) => {
      return r;
    });
};
