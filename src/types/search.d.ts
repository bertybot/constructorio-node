import {
  ConstructorClientOptions,
  Facet,
  Feature,
  FilterExpression,
  FmtOptions,
  Group,
  NetworkParameters,
  RequestFeature,
  RequestFeatureVariant,
  ResultSources,
  SortOption,
  UserParameters,
} from '.';

export default Search;

export interface SearchParameters {
  page?: number;
  resultsPerPage?: number;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: string;
  section?: string;
  fmtOptions?: FmtOptions;
  preFilterExpression?: FilterExpression;
  hiddenFields?: string[];
  hiddenFacets?: string[];
  variationsMap?: Record<string, any>;
  qsParam?: Record<string, any>;
}

declare class Search {
  constructor(options: ConstructorClientOptions);

  options: ConstructorClientOptions;

  getSearchResults(
    query: string,
    parameters?: SearchParameters,
    userParameters?: UserParameters,
    networkParameters?: NetworkParameters
  ): Promise<SearchResponse>;

  getVoiceSearchResults(
    query: string,
    parameters?: Omit<SearchParameters, 'filters' | 'sortBy' | 'sortOrder'>,
    userParameters?: UserParameters,
    networkParameters?: NetworkParameters
  ): Promise<SearchResponse>;
}

/* search results returned from server */
export interface SearchResponse {
  request: Partial<SearchRequestType>;
  response: Partial<Response | Redirect>;
  result_id: string;
}

export interface Response extends Record<string, any> {
  result_sources: Partial<ResultSources>;
  facets: Partial<Facet>[];
  groups: Partial<Group>[];
  results: Partial<SearchResultType>[];
  sort_options: Partial<SortOption>[];
  refined_content: Record<string, any>[];
  total_num_results: number;
  features: Partial<Feature>[];
}

export interface SearchRequestType extends Record<string, any> {
  page: number;
  num_results_per_page: number;
  section: string;
  blacklist_rules: boolean;
  term: string;
  fmt_options: FmtOptions;
  original_query?: string;
  sort_by: string;
  sort_order: string;
  features: Partial<RequestFeature>;
  feature_variants: Partial<RequestFeatureVariant>;
  searchandized_items: Record<string, any>;
}

export interface SearchResultType extends Record<string, any> {
  matched_terms: string[];
  data: {
    id: string;
    [key: string]: any;
  };
  value: string;
  is_slotted: false;
  labels: Record<string, any>;
  variations: Record<string, any>[];
}

export interface Redirect extends Record<string, any> {
  redirect: {
    data: {
      match_id: number;
      rule_id: number;
      url: string;
      [key: string]: any;
    };
    matched_terms: string[];
    matched_user_segments: string[];
  };
}
