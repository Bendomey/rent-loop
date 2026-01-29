import { cleanParams, type ObjectT } from "./remove-nulls";

export const getQueryParams = <FilterT>(
  props: FetchMultipleDataInputParams<FilterT>,
) => {
  const filters: ObjectT = props.filters ?? {};
  const query = cleanParams(filters);

  const updatedFilter: Record<string, Nullable<string>> = { ...query };

  return cleanParams({
    page_size: props.pagination ? props.pagination.per : undefined,
    page: props.pagination ? props.pagination.page : undefined,
    query: props.search?.query,
    search_fields: props.search?.fields
      ? props.search.fields.join(",")
      : undefined,
    ...(props.sorter ?? {}),
    populate: props.populate ? props.populate.join(",") : undefined,
    ...updatedFilter,
  });
};
