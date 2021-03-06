import {
  CategorySearch,
  ProductSearch,
  OrderSearch,
  Filter,
  FilterOption,
  AttributeType
} from './../../types/Api';
import { getSettings } from './../../index';

const buildAttributePredicate = (attrName: string, attrType: string) => (option: FilterOption): string => {
  const { locale, currency } = getSettings();

  if (!option.selected) {
    return '';
  }

  let valuePredicate: string;
  switch (attrType) {
    case AttributeType.STRING:
      valuePredicate = `value = "${option.value}"`;
      break;
    case AttributeType.DATE:
    case AttributeType.DATETIME:
    case AttributeType.TIME:
      valuePredicate = Array.isArray(option.value) ? `value >= "${option.value[0]}" and value <= "${option.value[1]}"` : `value = "${option.value}"`;
      break;
    case AttributeType.NUMBER:
      valuePredicate = Array.isArray(option.value) ? `value >= ${option.value[0]} and value <= ${option.value[1]}` : `value = ${option.value}`;
      break;
    case AttributeType.ENUM:
    case AttributeType.LOCALIZED_ENUM:
      valuePredicate = `value(key = "${option.value}")`;
      break;
    case AttributeType.LOCALIZED_STRING:
      valuePredicate = `value(${locale.toLowerCase()} = "${option.value}")`;
      break;
    case AttributeType.MONEY:
      valuePredicate = Array.isArray(option.value)
        ? `value(centAmount >= ${(option.value[0] as number) * 100} and centAmount <= ${(option.value[1] as number) * 100} and currencyCode = "${currency}")`
        : `value(centAmount = ${option.value} and currencyCode = "${currency}")`;
      break;
    case AttributeType.BOOLEAN:
      valuePredicate = `value = ${option.value}`;
      break;
  }

  return `masterData(current(masterVariant(attributes(name = "${attrName}" and ${valuePredicate}))))`;
};

const mapFilterToPredicates = ([name, filter]: [string, Filter]): string => {
  const hasAnyOptionSelected = filter.options.some(option => option.selected);
  if (!hasAnyOptionSelected) {
    return '';
  }

  const predicateMapper = buildAttributePredicate(name, filter.type);
  const predicates: string[] = filter.options.map(predicateMapper).filter(Boolean);
  return `(${predicates.join(' or ')})`;
};

const buildProductWhere = (search: ProductSearch) => {
  const { acceptLanguage } = getSettings();

  let predicates: string[] = [];
  if (search?.catId) {
    const catIds = (Array.isArray(search.catId) ? search.catId : [search.catId]).join('","');
    predicates.push(`masterData(current(categories(id in ("${catIds}"))))`);
  }

  if (search?.slug) {
    const predicate = acceptLanguage.map(locale => `${locale}="${search.slug}"`).join(' or ');
    predicates.push(`masterData(current(slug(${predicate})))`);
  }

  if (search?.id) {
    predicates.push(`id="${search.id}"`);
  }

  if (search?.filters) {
    predicates = [
      ...predicates,
      ...Object.entries(search.filters).map(mapFilterToPredicates).filter(Boolean)
    ];
  }

  return predicates.join(' and ');
};

const buildCategoryWhere = (search: CategorySearch) => {
  const { acceptLanguage } = getSettings();

  if (search?.catId) {
    return `id="${search.catId}"`;
  }

  if (search?.slug) {
    const predicate = acceptLanguage.map(locale => `${locale}="${search.slug}"`).join(' or ');
    return `slug(${predicate})`;
  }

  return '';
};

const buildOrderWhere = (search: OrderSearch): string => {
  if (search?.id) {
    return `id="${search.id}"`;
  }

  return null;
};

const resolveCustomQueryVariables = (defaultVariables: {}, customVariables: {}, type?: 'category' | 'order') => {
  const variables = {};
  for (const [key, value] of Object.entries(defaultVariables)) {
    if (customVariables[key] && key === 'where') {
      switch (type) {
        case 'category':
          variables[key] = buildCategoryWhere(value);
          break;
        case 'order':
          variables[key] = buildOrderWhere(value);
          break;
        default:
          variables[key] = buildProductWhere(value);
      }
    } else {
      variables[key] = customVariables[key] ? customVariables[key] : value;
    }
  }
  return variables;
};

export {
  buildProductWhere,
  buildCategoryWhere,
  buildOrderWhere,
  resolveCustomQueryVariables
};
