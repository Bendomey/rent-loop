type PossiblyUndefined<T> = T | undefined
type Nullable<T> = T | null
type StringList = Array<string>
type NumberList = Array<number>
type BooleanList = Array<boolean>
type StringRecord = Record<string, string>
type NumberRecord = Record<string, number>
type BooleanRecord = Record<string, boolean>
type StringMap = Map<string, string>
type NumberMap = Map<string, number>
type BooleanMap = Map<string, boolean>
type NumberLike = string | number
type Empty = {}

declare global {
	interface Window {
		ENV: {
			API_ADDRESS: string
		}
	}
}

interface ApiResponse<T> {
	data: T
	errorMessage: Nullable<string>
	status: boolean
}

interface Pagination {
	per?: NumberLike
	page?: NumberLike
}

interface Sorter {
	sort?: 'asc' | 'desc'
	sortBy?: string
}

interface Search {
	query?: string
	fields?: Array<string> // not used on the api level.
}

interface FetchMultipleDataInputParams<FilterT> {
	pagination?: Pagination
	sorter?: Sorter
	filters?: FilterT
	search?: Search
	populate?: StringList
}

interface FetchMultipleDataResponse<T> {
	rows: T[]
	total: number
	page: number
	page_size: number
	total_pages: number
	prev_page: Nullable<number>
	next_page: Nullable<number>
}

interface ApiConfigForServerConfig {
	authToken?: string
	baseUrl: string
}
