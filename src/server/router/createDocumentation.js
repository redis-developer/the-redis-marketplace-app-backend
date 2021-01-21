const axios = require("axios");
const handlebars = require("handlebars");
const { paramCase } = require("change-case");
const {
  writeFile: fsWriteFileAsync,
  mkdir: mkdirAsync,
} = require("fs").promises;
const { get: _get } = require("lodash");
const { docRepository } = require("../../config/serverConfig");

const repoPath = `../${docRepository}`;

const readMeHbsSource = `---
id: index-{{fileName}}
title: {{appName}}
sidebar_label: {{appName}}
slug: /marketplace/{{fileName}}
---

{{readMe}}
`;

handlebars.registerHelper("list", (context, options) => {
  let ret = "<ul>";

  context.forEach((ctx) => {
    ret = `${ret}<li>${options.fn(ctx)}</li>`;
  });

  return `${ret}</ul>`;
});

const marketplaceIndexHbsSource = `---
id: index-marketplace
title: Marketplace
sidebar_label: Marketplace
slug: /marketplace/
---

import useBaseUrl from '@docusaurus/useBaseUrl';

<div>
    {{#list nameList}}
    <a href={useBaseUrl('/marketplace/{{fileName}}')}>{{appName}}</a>
    {{/list}}
</div>

`;

const marketPlaceFolderPath = "docs/marketplace";

module.exports = async (marketplaceList) => {
  const nameList = [];

  /* eslint-disable no-restricted-syntax */
  for (const list of marketplaceList) {
    /* eslint-disable no-await-in-loop */

    const readMeUrl = _get(list, "markdown", null);
    const appName = _get(list, "app_name", null);

    const fileName = paramCase(appName);

    const readMeResponse = await axios.get(readMeUrl);
    const readMe = _get(readMeResponse, "data", null);

    const readMeTemplate = handlebars.compile(readMeHbsSource);

    const generatedReadme = readMeTemplate({
      appName,
      fileName,
      readMe,
    });

    const documentPath = `${repoPath}/${marketPlaceFolderPath}/${fileName}`;

    await mkdirAsync(`${documentPath}`, { recursive: true });

    await fsWriteFileAsync(`${documentPath}/${fileName}.mdx`, generatedReadme);

    nameList.push({ appName, fileName });
  }

  const tocTemplate = handlebars.compile(marketplaceIndexHbsSource);

  const generatedToc = tocTemplate({ nameList });

  await fsWriteFileAsync(
    `${repoPath}/${marketPlaceFolderPath}/index-marketplace.mdx`,
    generatedToc
  );

  const sideBarLinks = nameList.map(
    ({ fileName }) => `marketplace/${fileName}/index-${fileName}`
  );

  await fsWriteFileAsync(
    `${repoPath}/marketplace-sidebar.json`,
    JSON.stringify(sideBarLinks)
  );
};
