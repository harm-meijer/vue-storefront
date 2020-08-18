/* tslint:disable */

// import { getCategory } from "../getCategory";

/* eslint-disable quotes */
const TOKEN = "Bearer 7Vu86kYRWOuoEFTdlDK0w3EvS0NjQSQX";
const withToken = (fn) => (arg) => fn(arg, TOKEN);
const setCategory = (category) =>
  category
    ? [
      [
        "filter.query",
        `categories.id:subtree("${category}")`
      ]
    ]
    : [];
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
const locale = () => "en";
const facets = (query = {}, locale) =>
  config.facetSearches.reduce((result, { name, type }) => {
    // eslint-disable-next-line no-prototype-builtins
    if (query.hasOwnProperty(name)) {
      result["filter.query"] = result["filter.query"] || [];
      result["filter.query"].push(
        `${asAttribute(name, type, locale)}:${
          Array.isArray(query[name])
            ? query[name]
              .map((value) => `"${value}"`)
              .join(",")
            : `"${query[name]}"`
        }`
      );
    }
    return result;
  }, {});
const paging = (query) => {
  const paging = [];
  if (query.pageSize) {
    paging.push(["limit", query.pageSize]);
  }
  if (query.page) {
    paging.push(["offset", query.page - 1]);
  }
  return paging;
};

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
      return Promise.all([
        groupFetchJson(
          toUrl(`${baseUrl}/product-projections/search`, [
            ...paging(query),
            ...setCategory(query.category),
            ...Object.entries(query)
              .filter(
                ([, val]) =>
                  !(val === null || val === undefined)
              )
              .filter(([k]) => k === "priceFilter")
              .map(([, v]) => {
                return ["filter.query", v];
              }),
            ...Object.entries(facets(query, locale)),
            ...totalFacets.map(({ name, type }) => [
              "facet",
              `${asAttribute(
                name,
                type,
                locale
              )} counting products`
            ])
          ]),
          makeConfig(accessToken)
        )
      ]).then(([{ facets, ...result }]) => ({
        ...result,
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
      }));
    }
  )
};

export default (search) => {
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
      locale()
    ])
    .then((r) => {
      return r;
    });
};
