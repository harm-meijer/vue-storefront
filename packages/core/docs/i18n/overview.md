# Internationalization

By default we are using `nuxt-i18n` module for handling internationalization, but it's not mandatory to use it even if you are using nuxt.

In order to provide unify way of configure i18n across the application, we have introduced field `i18n` in the nuxt.config.js file that has same format as `nuxt-i18n` options. Clearly, it's possible to add there any configuration if there is a necessity.

Other modules such as integration ones, will consume this section as the single source of truth for i18n.
Additionally to tell the modules to use that section we always should set `useNuxtI18nModule` to true under the `i18n` key.

```
['@vue-storefront/commercetools/nuxt', {
  api: {
    uri: 'https://yourshop.com/some-key/graphql',
  },
  i18n: {
    useNuxtI18nModule: true
  }
}]
```

In case when you set this flag to false, you are always able to provide your own i18n configuration just for this module.

```
['@vue-storefront/commercetools/nuxt', {
  api: {
    uri: 'https://yourshop.com/some-key/graphql',
  },
  i18n: {
    useNuxtI18nModule: false,
    locales: [
      {
        code: 'en',
        label: 'English',
        file: 'en.js',
        iso: 'en'
      },
      {
        code: 'de',
        label: 'German',
        file: 'de.js',
        iso: 'de'
      }
    ],
    defaultLocale: 'en'
  }
}]
```
