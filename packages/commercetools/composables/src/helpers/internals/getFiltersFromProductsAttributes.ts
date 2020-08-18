export default ({ facets }) => {
  return facets.map((facet) => [
    facet.name,
    {
      // @todo: what here?
      type: 'EnumAttribute',
      options: facet.terms.map((term) => ({
        value: term.term,
        label: term.term,
        selected: false
      }))
    }
  ]).reduce(
    (result, [key, value])=>{
      result[key] = value;
      return result;
    }, {}
  );
};
