type PossiblyUndefined<T> = T | undefined;
type Nullable<T> = T | null;
type Maybe<T> = T | null | undefined;
type StringList = Array<string>;
type NumberList = Array<number>;
type BooleanList = Array<boolean>;
type StringRecord = Record<string, string>;
type NumberRecord = Record<string, number>;
type BooleanRecord = Record<string, boolean>;
type StringMap = Map<string, string>;
type NumberMap = Map<string, number>;
type BooleanMap = Map<string, boolean>;
type NumberLike = string | number;
type Empty = {};

interface ApiResponse<T> {
  data: T;
  errors: Nullable<{ message: string }>;
}

interface Pagination {
  per?: NumberLike;
  page?: NumberLike;
}

interface Sorter {
  sort?: "asc" | "desc";
  sort_by?: string;
}

interface Search {
  query?: string;
  fields?: Array<string>; // not used on the api level.
}

interface FetchMultipleDataInputParams<FilterT> {
  pagination?: Pagination;
  sorter?: Sorter;
  filters?: FilterT;
  search?: Search;
  populate?: StringList;
}

interface FetchMultipleDataResponse<T> {
  rows: T[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    order: "asc" | "desc";
    order_by: string;
    has_prev_page: boolean;
    has_next_page: boolean;
  };
}

interface ApiConfigForServerConfig {
  authToken?: string;
  baseUrl: string;
}
