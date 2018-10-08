import {default as URL, QueryParams} from "url";
import AppConfig from "appConfig";
import formSubmit from "shared/lib/formSubmit";
import getBrowserWindow from "../lib/getBrowserWindow";

export function trimTrailingSlash(str:string){
   return str.replace(/\/$/g,"");
}

export type BuildUrlParams = {pathname:string, query?:QueryParams, hash?:string};

export function buildCBioPortalAPIUrl(params:BuildUrlParams):string;
export function buildCBioPortalAPIUrl(pathname:string, query?:QueryParams, hash?:string):string;
export function buildCBioPortalAPIUrl(pathnameOrParams:string | BuildUrlParams, query?:QueryParams, hash?:string) {
    let params:BuildUrlParams = typeof pathnameOrParams === 'string' ? {pathname: pathnameOrParams, query, hash} : pathnameOrParams;


    const apiRootUrl = URL.parse(trimTrailingSlash(AppConfig.apiRoot!));

    // prepend the root path (e.g. "beta"
    params.pathname = trimTrailingSlash(apiRootUrl.pathname || "") + "/" + (params.pathname || "");

    return URL.format({
        protocol: apiRootUrl.protocol || getBrowserWindow().location.protocol,
        host: apiRootUrl.host,
        ...params
    });
}

// this will produce a URL relative to the host protocol of the current HTML page in browser
export function buildCBioPortalPageUrl(params:BuildUrlParams):string;
export function buildCBioPortalPageUrl(pathname:string, query?:QueryParams, hash?:string):string;
export function buildCBioPortalPageUrl(pathnameOrParams:string | BuildUrlParams, query?:QueryParams, hash?:string) {
    let params:BuildUrlParams = typeof pathnameOrParams === 'string' ? {pathname: pathnameOrParams, query, hash} : pathnameOrParams;
    return URL.format({
        protocol: window.location.protocol,
        host: AppConfig.baseUrl,
        ...params
    });
}

// this gives us the root of the instance (.e.g. //www.bioportal.org/beta)
export function buildCBioLink(path:string){
    return '//' + AppConfig.baseUrl + '/' + path;
}

export function getCbioPortalApiUrl() {
    const root = trimTrailingSlash(AppConfig.apiRoot!);
    return `${root}/api`
}
function getStudySummaryUrlParams(studyIds:string | ReadonlyArray<string>) {
    let cohortsArray:ReadonlyArray<string>;
    if (typeof studyIds === "string") {
        cohortsArray = [studyIds];
    } else {
        cohortsArray = studyIds;
    }
    return {pathname:'study', query: {id: cohortsArray.join(",")}};
}

export function getStudySummaryUrl(studyIds:string | ReadonlyArray<string>) {
    const params = getStudySummaryUrlParams(studyIds);
    return buildCBioPortalPageUrl(params.pathname, params.query);
}
export function openStudySummaryFormSubmit(studyIds: string | ReadonlyArray<string>) {
    const params = getStudySummaryUrlParams(studyIds);
    const method:"get"|"post" = params.query.id.length > 1800 ? "post" : "get";
    (window as any).routingStore.updateRoute(params.query,"newstudy");
    //formSubmit(params.pathname, params.query, "_blank", method);
}
export function getSampleViewUrl(studyId:string, sampleId:string, navIds?:{patientId:string, studyId:string}[]) {
    let hash:any = undefined;
    if (navIds) {
        hash = `navCaseIds=${navIds.map(id=>`${id.studyId}:${id.patientId}`).join(",")}`;
    }
    return buildCBioPortalPageUrl('patient', { sampleId, studyId }, hash);
}
export function getPatientViewUrl(studyId:string, caseId:string, navIds?:{patientId:string, studyId:string}[]) {
    let hash:any = undefined;
    if (navIds) {
        hash = `navCaseIds=${navIds.map(id=>`${id.studyId}:${id.patientId}`).join(",")}`;
    }
    return buildCBioPortalPageUrl('patient', { studyId, caseId }, hash);
}
export function getPubMedUrl(pmid:string) {
    return `https://www.ncbi.nlm.nih.gov/pubmed/${pmid}`;
}
export function getMyGeneUrl(entrezGeneId: number) {
    return `https://mygene.info/v3/gene/${entrezGeneId}?fields=uniprot`;
}
export function getUniprotIdUrl(swissProtAccession: string) {
    return `https://www.uniprot.org/uniprot/?query=accession:${swissProtAccession}&format=tab&columns=entry+name`;
}
export function getMutationAlignerUrl() {
    return buildCBioPortalAPIUrl(`getMutationAligner.json`);
}
export function getOncoQueryDocUrl() {
    return buildCBioPortalPageUrl("s/oql");
}
export function getOncoKbApiUrl() {
    let url = AppConfig.serverConfig.oncokb_public_api_url;

    if (typeof url === 'string') {
        // we need to support legacy configuration values
        url = url.replace(/^http[s]?:\/\//,''); // get rid of protocol
        url = url.replace(/\/$/,""); // get rid of trailing slashes

        return buildCBioPortalAPIUrl(`proxy/${url}`)
    } else {
        return undefined;
    }

}
export function getGenomeNexusApiUrl() {
    let url = AppConfig.serverConfig.genomenexus_url;
    if (typeof url === 'string') {
        // use url if https, otherwise use proxy
        if (url.startsWith('https://')) {
            return url
        } else {
            // we need to support legacy configuration values
            url = url.replace(/^http[s]?:\/\//,''); // get rid of protocol
            url = url.replace(/\/$/,""); // get rid of trailing slashes
            url = url.replace(/^\/+/,""); // get rid of leading slashes
            return buildCBioPortalAPIUrl(`proxy/${url}`)
        }
    } else {
        return undefined;
    }
}

export function getVirtualStudyServiceUrl() {
    return buildCBioPortalAPIUrl("api-legacy/proxy/session/virtual_study");
}

export function getSessionServiceUrl() {
    return buildCBioPortalAPIUrl("api-legacy/proxy/session/");
}

export function getConfigurationServiceApiUrl() {
    return AppConfig.configurationServiceUrl;
}

export function getG2SApiUrl() {
    return 'https://g2s.genomenexus.org';
}
export function getTissueImageCheckUrl(filter:string) {
    return buildCBioPortalAPIUrl('proxy/cancer.digitalslidearchive.net/local_php/get_slide_list_from_db_groupid_not_needed.php', {
        slide_name_filter: filter
    });
}
export function getDarwinUrl(sampleIds:string[], caseId:string) {
    return buildCBioPortalAPIUrl('checkDarwinAccess.do', {sample_id: sampleIds.join(','), case_id: caseId});
}

export function getStudyDownloadListUrl(){
    return buildCBioPortalAPIUrl('proxy/download.cbioportal.org/study_list.json');
}

export function getBitlyServiceUrl(){
    return buildCBioPortalAPIUrl('api-legacy/proxy/bitly');
}

export function getLegacyCopyNumberUrl(){
    return buildCBioPortalAPIUrl("api-legacy/copynumbersegments");
}


export function getBasePath(){
    return AppConfig.baseUrl!.replace(/[^\/]*/,"");
}

export function getDocsUrl(sourceUrl:string,docsBaseUrl?:string): string {
    // if it's complete url, then return it, otherwise, prefix with base url
    if (/^http/.test(sourceUrl)) {
        return sourceUrl;
    } else {
        return docsBaseUrl + "/" + sourceUrl;
    }
}

export function getLogoutURL(){
    return buildCBioPortalPageUrl(AppConfig.authLogoutUrl!)
}