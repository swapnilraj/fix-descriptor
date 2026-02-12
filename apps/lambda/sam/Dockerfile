FROM public.ecr.aws/lambda/nodejs:20

RUN (dnf -y install java-17-amazon-corretto-devel findutils || yum -y install java-17-amazon-corretto-devel findutils) \
  && (dnf clean all || yum clean all)

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /var/task
COPY . .

WORKDIR /var/task/apps/lambda
ENV NODE_ENV=development
ENV CI=true
RUN pnpm install


# Build SDK from source package (contains tsconfig/scripts).
RUN cd /var/task/packages/fixdescriptorkit-typescript && pnpm install && pnpm run build
# Always materialize built artifacts into runtime package path.
RUN rm -rf /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/dist /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/lib && \
  mkdir -p /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/dist /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/lib && \
  cp -R /var/task/packages/fixdescriptorkit-typescript/dist/. /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/dist/ && \
  cp -R /var/task/packages/fixdescriptorkit-typescript/lib/. /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/lib/
# Keep compatibility with any stale dist/src resolver expectations.
RUN ln -sfn /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/dist /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/dist/src
# Ensure generated codecs importing "agrona" resolve to the vendored agrona-ts inside ts-sdk
RUN ln -sfn /var/task/apps/lambda/node_modules/fixdescriptorkit-typescript/src/sbe/agrona-ts /var/task/apps/lambda/node_modules/agrona

RUN ln -s /var/task/apps/lambda/node_modules /var/task/node_modules


CMD ["apps/lambda/src/lambda-handler.handler"]
