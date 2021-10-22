import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, computed, makeObservable } from 'mobx';
import _ from 'lodash';
import {
    default as LazyMobXTable,
    Column,
    SortDirection,
} from 'shared/components/lazyMobXTable/LazyMobXTable';
import {
    CancerStudy,
    MolecularProfile,
    Mutation,
    ClinicalData,
} from 'cbioportal-ts-api-client';
import SampleColumnFormatter from './column/SampleColumnFormatter';
import TumorAlleleFreqColumnFormatter from './column/TumorAlleleFreqColumnFormatter';
import NormalAlleleFreqColumnFormatter from './column/NormalAlleleFreqColumnFormatter';
import MrnaExprColumnFormatter from './column/MrnaExprColumnFormatter';
import CohortColumnFormatter from './column/CohortColumnFormatter';
import DiscreteCNAColumnFormatter from './column/DiscreteCNAColumnFormatter';
import AlleleCountColumnFormatter from './column/AlleleCountColumnFormatter';
import GeneColumnFormatter from './column/GeneColumnFormatter';
import ChromosomeColumnFormatter from './column/ChromosomeColumnFormatter';
import ProteinChangeColumnFormatter from './column/ProteinChangeColumnFormatter';
import MutationTypeColumnFormatter from './column/MutationTypeColumnFormatter';
import VariantTypeColumnFormatter from './column/VariantTypeColumnFormatter';
import FunctionalImpactColumnFormatter from './column/FunctionalImpactColumnFormatter';
import CosmicColumnFormatter from './column/CosmicColumnFormatter';
import MutationCountColumnFormatter from './column/MutationCountColumnFormatter';
import CancerTypeColumnFormatter from './column/CancerTypeColumnFormatter';
import MutationStatusColumnFormatter from './column/MutationStatusColumnFormatter';
import ValidationStatusColumnFormatter from './column/ValidationStatusColumnFormatter';
import StudyColumnFormatter from './column/StudyColumnFormatter';
import { ICosmicData } from 'shared/model/Cosmic';
import AnnotationColumnFormatter from './column/AnnotationColumnFormatter';
import ExonColumnFormatter from './column/ExonColumnFormatter';
import { IMutSigData } from 'shared/model/MutSig';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import VariantCountCache from 'shared/cache/VariantCountCache';
import PubMedCache from 'shared/cache/PubMedCache';
import MutationCountCache from 'shared/cache/MutationCountCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { ILazyMobXTableApplicationLazyDownloadDataFetcher } from 'shared/lib/ILazyMobXTableApplicationLazyDownloadDataFetcher';
import generalStyles from './column/styles.module.scss';
import classnames from 'classnames';
import { IPaginationControlsProps } from '../paginationControls/PaginationControls';
import { IColumnVisibilityControlsProps } from '../columnVisibilityControls/ColumnVisibilityControls';
import {
    generateQueryVariantId,
    IOncoKbData,
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IMyCancerGenomeData,
    RemoteData,
} from 'cbioportal-utils';
import { IMyVariantInfoIndex } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import { getAnnotationData, IAnnotation } from 'react-mutation-mapper';
import HgvscColumnFormatter from './column/HgvscColumnFormatter';
import HgvsgColumnFormatter from './column/HgvsgColumnFormatter';
import GnomadColumnFormatter from './column/GnomadColumnFormatter';
import ClinvarColumnFormatter from './column/ClinvarColumnFormatter';
import autobind from 'autobind-decorator';
import DbsnpColumnFormatter from './column/DbsnpColumnFormatter';
import SignalColumnFormatter from './column/SignalColumnFormatter';
import { getDefaultASCNCopyNumberColumnDefinition } from 'shared/components/mutationTable/column/ascnCopyNumber/ASCNCopyNumberColumnFormatter';
import { getDefaultASCNMethodColumnDefinition } from 'shared/components/mutationTable/column/ascnMethod/ASCNMethodColumnFormatter';
import { getDefaultCancerCellFractionColumnDefinition } from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionColumnFormatter';
import { getDefaultClonalColumnDefinition } from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';
import { getDefaultExpectedAltCopiesColumnDefinition } from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesColumnFormatter';

export interface IMutationTableProps {
    studyIdToStudy?: { [studyId: string]: CancerStudy };
    uniqueSampleKeyToTumorType?: { [uniqueSampleKey: string]: string };
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    };
    discreteCNACache?: DiscreteCNACache;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    mrnaExprRankCache?: MrnaExprRankCache;
    variantCountCache?: VariantCountCache;
    pubMedCache?: PubMedCache;
    mutationCountCache?: MutationCountCache;
    genomeNexusCache?: GenomeNexusCache;
    genomeNexusMutationAssessorCache?: GenomeNexusMutationAssessorCache;
    mutSigData?: IMutSigData;
    enableOncoKb?: boolean;
    enableMyCancerGenome?: boolean;
    enableHotspot?: boolean;
    enableCivic?: boolean;
    enableFunctionalImpact?: boolean;
    myCancerGenomeData?: IMyCancerGenomeData;
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    indexedMyVariantInfoAnnotations?: RemoteData<
        IMyVariantInfoIndex | undefined
    >;
    cosmicData?: ICosmicData;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    usingPublicOncoKbInstance: boolean;
    civicGenes?: RemoteData<ICivicGeneIndex | undefined>;
    civicVariants?: RemoteData<ICivicVariantIndex | undefined>;
    mrnaExprRankMolecularProfileId?: string;
    discreteCNAMolecularProfileId?: string;
    columns?: ExtendedMutationTableColumnType[];
    data?: Mutation[][];
    dataStore?: ILazyMobXTableApplicationDataStore<Mutation[]>;
    downloadDataFetcher?: ILazyMobXTableApplicationLazyDownloadDataFetcher;
    initialItemsPerPage?: number;
    itemsLabel?: string;
    itemsLabelPlural?: string;
    userEmailAddress?: string;
    initialSortColumn?: string;
    initialSortDirection?: SortDirection;
    paginationProps?: IPaginationControlsProps;
    showCountHeader?: boolean;
    selectedTranscriptId?: string;
    columnVisibility?: { [columnId: string]: boolean };
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    storeColumnVisibility?: (columnVisibility: {
        [columnId: string]: boolean;
    }) => void;
    onRowClick?: (d: Mutation[]) => void;
    onRowMouseEnter?: (d: Mutation[]) => void;
    onRowMouseLeave?: (d: Mutation[]) => void;
    generateGenomeNexusHgvsgUrl: (hgvsg: string) => string;
    sampleIdToClinicalDataMap?: MobxPromise<{ [x: string]: ClinicalData[] }>;
    columnToHeaderFilterIconModal?: (
        column: Column<Mutation[]>
    ) => JSX.Element | undefined;
    deactivateColumnFilter?: (columnId: string) => void;
}
import MobxPromise from 'mobxpromise';
import { getServerConfig } from 'config/config';

export enum MutationTableColumnType {
    STUDY = 'Study of Origin',
    SAMPLE_ID = 'Sample ID',
    SAMPLES = 'Samples',
    GENE = 'Gene',
    PROTEIN_CHANGE = 'Protein Change',
    CHROMOSOME = 'Chromosome',
    START_POS = 'Start Pos',
    END_POS = 'End Pos',
    REF_ALLELE = 'Ref',
    VAR_ALLELE = 'Var',
    MUTATION_STATUS = 'MS',
    VALIDATION_STATUS = 'VS',
    MUTATION_TYPE = 'Mutation Type',
    VARIANT_TYPE = 'Variant Type',
    CLONAL = 'Clonality',
    CANCER_CELL_FRACTION = 'CCF',
    EXPECTED_ALT_COPIES = 'Mutant Integer Copy #',
    CENTER = 'Center',
    TUMOR_ALLELE_FREQ = 'Allele Freq (T)',
    NORMAL_ALLELE_FREQ = 'Allele Freq (N)',
    FUNCTIONAL_IMPACT = 'Functional Impact',
    ANNOTATION = 'Annotation',
    HGVSG = 'HGVSg',
    COSMIC = 'COSMIC',
    COPY_NUM = 'Copy #',
    ASCN_COPY_NUM = 'Total Integer Copy #',
    ASCN_METHOD = 'ASCN Method',
    MRNA_EXPR = 'mRNA Expr.',
    COHORT = 'Cohort',
    REF_READS_N = 'Ref Reads (Normal)',
    VAR_READS_N = 'Variant Reads (Normal)',
    REF_READS = 'Ref Reads',
    VAR_READS = 'Variant Reads',
    CANCER_TYPE_DETAILED = 'Cancer Type Detailed',
    NUM_MUTATIONS = '# Mut in Sample',
    EXON = 'Exon',
    HGVSC = 'HGVSc',
    GNOMAD = 'gnomAD',
    CLINVAR = 'ClinVar',
    SELECTED = 'Selected',
    DBSNP = 'dbSNP',
    GENE_PANEL = 'Gene panel',
    SIGNAL = 'SIGNAL',
}
type ExtendedMutationTableColumnType = MutationTableColumnType | string;

type MutationTableColumn = Column<Mutation[]> & {
    order?: number;
    shouldExclude?: () => boolean;
};

export class MutationTableComponent extends LazyMobXTable<Mutation[]> {}

export function getDivForDataField(
    data: Mutation[],
    dataField: string,
    isInteger?: boolean
) {
    let contents = getTextForDataField(data, dataField);
    return (
        <div
            className={classnames(
                isInteger ? generalStyles['integer-data'] : undefined
            )}
        >
            {contents}
        </div>
    );
}

export function getTextForDataField(data: Mutation[], dataField: string) {
    let text = '';
    if (data.length > 0 && data[0].hasOwnProperty(dataField)) {
        text = (data[0] as any)[dataField];
    }
    return text;
}

export function defaultFilter(
    data: Mutation[],
    dataField: string,
    filterStringUpper: string
): boolean {
    if (data.length > 0) {
        return data.reduce((match: boolean, next: Mutation) => {
            const val = (next as any)[dataField];
            if (val) {
                return match || val.toUpperCase().includes(filterStringUpper);
            } else {
                return match;
            }
        }, false);
    } else {
        return false;
    }
}

@observer
export default class MutationTable<
    P extends IMutationTableProps
> extends React.Component<P, {}> {
    @observable protected _columns: Record<
        ExtendedMutationTableColumnType,
        MutationTableColumn
    >;
    @observable.ref public table: LazyMobXTable<Mutation[]> | null = null;
    @observable oncokbWidth = 22;
    private oncokbInterval: any;

    public static defaultProps = {
        initialItemsPerPage: 25,
        showCountHeader: true,
        paginationProps: { itemsPerPageOptions: [25, 50, 100] },
        initialSortColumn: 'Annotation',
        initialSortDirection: 'desc',
        itemsLabel: 'Mutation',
        itemsLabelPlural: 'Mutations',
        enableOncoKb: true,
        enableMyCancerGenome: true,
        enableHotspot: true,
        enableCivic: false,
    };

    constructor(props: P) {
        super(props);
        makeObservable(this);
        this._columns = {} as Record<
            ExtendedMutationTableColumnType,
            MutationTableColumn
        >;
        this.generateColumns();
        this.oncokbInterval = setInterval(() => {
            const oncokbContentWidth = document
                .getElementById('mutation-annotation')
                ?.getElementsByClassName('oncokb-content')[0]?.clientWidth;
            if (oncokbContentWidth) {
                this.oncokbWidth = Number(oncokbContentWidth) || 22;
                clearInterval(this.oncokbInterval);
            }
        }, 500);
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    @autobind
    private tableRef(t: LazyMobXTable<Mutation[]> | null) {
        this.table = t;
    }

    @autobind
    private resolveTumorType(mutation: Mutation) {
        // first, try to get it from uniqueSampleKeyToTumorType map
        if (this.props.uniqueSampleKeyToTumorType) {
            return this.props.uniqueSampleKeyToTumorType[
                mutation.uniqueSampleKey
            ];
        }

        // second, try the study cancer type
        if (this.props.studyIdToStudy) {
            const studyMetaData = this.props.studyIdToStudy[mutation.studyId];

            if (studyMetaData.cancerTypeId !== 'mixed') {
                return studyMetaData.cancerType.name;
            }
        }

        // return Unknown, this should not happen...
        return 'Unknown';
    }

    protected generateColumns() {
        this._columns = {} as Record<
            ExtendedMutationTableColumnType,
            MutationTableColumn
        >;

        this._columns[MutationTableColumnType.STUDY] = {
            id: 'CANCER_STUDY',
            name: MutationTableColumnType.STUDY,
            render: (d: Mutation[]) =>
                StudyColumnFormatter.renderFunction(
                    d,
                    this.props.molecularProfileIdToMolecularProfile,
                    this.props.studyIdToStudy
                ),
            download: (d: Mutation[]) =>
                StudyColumnFormatter.getTextValue(
                    d,
                    this.props.molecularProfileIdToMolecularProfile,
                    this.props.studyIdToStudy
                ),
            sortBy: (d: Mutation[]) =>
                StudyColumnFormatter.getTextValue(
                    d,
                    this.props.molecularProfileIdToMolecularProfile,
                    this.props.studyIdToStudy
                ),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => {
                return StudyColumnFormatter.filter(
                    d,
                    filterStringUpper,
                    this.props.molecularProfileIdToMolecularProfile,
                    this.props.studyIdToStudy
                );
            },
            tooltip: <span>Study of Origin</span>,
            visible: false,
            resizable: true,
            truncateOnResize: true,
        };

        this._columns[MutationTableColumnType.SAMPLE_ID] = {
            name: MutationTableColumnType.SAMPLE_ID,
            render: (d: Mutation[]) =>
                SampleColumnFormatter.renderFunction(
                    d,
                    this.props.molecularProfileIdToMolecularProfile
                ),
            download: SampleColumnFormatter.getTextValue,
            sortBy: SampleColumnFormatter.getTextValue,
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => defaultFilter(d, 'sampleId', filterStringUpper),
            visible: true,
            resizable: true,
            truncateOnResize: true,
        };

        this._columns[MutationTableColumnType.TUMOR_ALLELE_FREQ] = {
            name: MutationTableColumnType.TUMOR_ALLELE_FREQ,
            render: TumorAlleleFreqColumnFormatter.renderFunction,
            headerRender: (name: string) => (
                <span style={{ display: 'inline-block', maxWidth: 55 }}>
                    {name}
                </span>
            ),
            download: TumorAlleleFreqColumnFormatter.getTextValue,
            sortBy: TumorAlleleFreqColumnFormatter.getSortValue,
            tooltip: <span>Variant allele frequency in the tumor sample</span>,
            visible: true,
        };

        this._columns[MutationTableColumnType.NORMAL_ALLELE_FREQ] = {
            name: MutationTableColumnType.NORMAL_ALLELE_FREQ,
            render: NormalAlleleFreqColumnFormatter.renderFunction,
            headerRender: (name: string) => (
                <span style={{ display: 'inline-block', maxWidth: 55 }}>
                    {name}
                </span>
            ),
            download: NormalAlleleFreqColumnFormatter.getTextValue,
            sortBy: NormalAlleleFreqColumnFormatter.getSortValue,
            tooltip: <span>Variant allele frequency in the normal sample</span>,
            visible: false,
        };

        this._columns[MutationTableColumnType.MRNA_EXPR] = {
            name: MutationTableColumnType.MRNA_EXPR,
            render: (d: Mutation[]) =>
                this.props.mrnaExprRankCache ? (
                    MrnaExprColumnFormatter.renderFunction(
                        d,
                        this.props.mrnaExprRankCache as MrnaExprRankCache
                    )
                ) : (
                    <span></span>
                ),
        };

        this._columns[MutationTableColumnType.COHORT] = {
            name: MutationTableColumnType.COHORT,
            render: (d: Mutation[]) =>
                this.props.variantCountCache ? (
                    CohortColumnFormatter.renderFunction(
                        d,
                        this.props.mutSigData,
                        this.props.variantCountCache as VariantCountCache
                    )
                ) : (
                    <span></span>
                ),
            sortBy: (d: Mutation[]) => {
                const cache = this.props.variantCountCache;
                if (cache) {
                    return CohortColumnFormatter.getSortValue(
                        d,
                        cache as VariantCountCache
                    );
                } else {
                    return 0;
                }
            },
            tooltip: <span>Mutation frequency in cohort</span>,
            defaultSortDirection: 'desc',
        };

        this._columns[MutationTableColumnType.COPY_NUM] = {
            name: MutationTableColumnType.COPY_NUM,
            render: (d: Mutation[]) => {
                if (
                    this.props.discreteCNACache &&
                    this.props.molecularProfileIdToMolecularProfile
                ) {
                    return DiscreteCNAColumnFormatter.renderFunction(
                        d,
                        this.props.molecularProfileIdToMolecularProfile as {
                            [molecularProfileId: string]: MolecularProfile;
                        },
                        this.props.discreteCNACache as DiscreteCNACache
                    );
                } else {
                    return <span></span>;
                }
            },
            sortBy: (d: Mutation[]): number | null => {
                if (
                    this.props.discreteCNACache &&
                    this.props.molecularProfileIdToMolecularProfile
                ) {
                    return DiscreteCNAColumnFormatter.getSortValue(
                        d,
                        this.props.molecularProfileIdToMolecularProfile as {
                            [molecularProfileId: string]: MolecularProfile;
                        },
                        this.props.discreteCNACache as DiscreteCNACache
                    );
                } else {
                    return 0;
                }
            },
            download: (d: Mutation[]): string => {
                if (
                    this.props.discreteCNACache &&
                    this.props.molecularProfileIdToMolecularProfile
                ) {
                    return DiscreteCNAColumnFormatter.getTextValue(
                        d,
                        this.props.molecularProfileIdToMolecularProfile as {
                            [molecularProfileId: string]: MolecularProfile;
                        },
                        this.props.discreteCNACache as DiscreteCNACache
                    );
                } else {
                    return '';
                }
            },
            filter: (d: Mutation[], filterString: string) => {
                if (
                    this.props.discreteCNACache &&
                    this.props.molecularProfileIdToMolecularProfile
                ) {
                    return DiscreteCNAColumnFormatter.filter(
                        d,
                        this.props.molecularProfileIdToMolecularProfile as {
                            [molecularProfileId: string]: MolecularProfile;
                        },
                        this.props.discreteCNACache as DiscreteCNACache,
                        filterString
                    );
                } else {
                    return false;
                }
            },
            visible: DiscreteCNAColumnFormatter.isVisible(
                this.props.discreteCNACache as DiscreteCNACache
            ),
        };

        this._columns[MutationTableColumnType.REF_READS_N] = {
            name: MutationTableColumnType.REF_READS_N,
            render: (d: Mutation[]) =>
                AlleleCountColumnFormatter.renderFunction(
                    d,
                    [d[0].sampleId],
                    'normalRefCount'
                ),
            download: (d: Mutation[]) =>
                AlleleCountColumnFormatter.getTextValue(
                    d,
                    [d[0].sampleId],
                    'normalRefCount'
                ),
            sortBy: (d: Mutation[]) => d.map(m => m.normalRefCount),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.VAR_READS_N] = {
            name: MutationTableColumnType.VAR_READS_N,
            render: (d: Mutation[]) =>
                AlleleCountColumnFormatter.renderFunction(
                    d,
                    [d[0].sampleId],
                    'normalAltCount'
                ),
            download: (d: Mutation[]) =>
                AlleleCountColumnFormatter.getTextValue(
                    d,
                    [d[0].sampleId],
                    'normalAltCount'
                ),
            sortBy: (d: Mutation[]) => d.map(m => m.normalAltCount),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.REF_READS] = {
            name: MutationTableColumnType.REF_READS,
            render: (d: Mutation[]) =>
                AlleleCountColumnFormatter.renderFunction(
                    d,
                    [d[0].sampleId],
                    'tumorRefCount'
                ),
            download: (d: Mutation[]) =>
                AlleleCountColumnFormatter.getTextValue(
                    d,
                    [d[0].sampleId],
                    'tumorRefCount'
                ),
            sortBy: (d: Mutation[]) => d.map(m => m.tumorRefCount),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.VAR_READS] = {
            name: MutationTableColumnType.VAR_READS,
            render: (d: Mutation[]) =>
                AlleleCountColumnFormatter.renderFunction(
                    d,
                    [d[0].sampleId],
                    'tumorAltCount'
                ),
            download: (d: Mutation[]) =>
                AlleleCountColumnFormatter.getTextValue(
                    d,
                    [d[0].sampleId],
                    'tumorAltCount'
                ),
            sortBy: (d: Mutation[]) => d.map(m => m.tumorAltCount),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.START_POS] = {
            name: MutationTableColumnType.START_POS,
            render: (d: Mutation[]) =>
                getDivForDataField(d, 'startPosition', true),
            download: (d: Mutation[]) =>
                getTextForDataField(d, 'startPosition'),
            sortBy: (d: Mutation[]) => d.map(m => m.startPosition),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.END_POS] = {
            name: MutationTableColumnType.END_POS,
            render: (d: Mutation[]) =>
                getDivForDataField(d, 'endPosition', true),
            download: (d: Mutation[]) => getTextForDataField(d, 'endPosition'),
            sortBy: (d: Mutation[]) => d.map(m => m.endPosition),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.REF_ALLELE] = {
            name: MutationTableColumnType.REF_ALLELE,
            render: (d: Mutation[]) => getDivForDataField(d, 'referenceAllele'),
            download: (d: Mutation[]) =>
                getTextForDataField(d, 'referenceAllele'),
            sortBy: (d: Mutation[]) => d.map(m => m.referenceAllele),
            visible: false,
        };

        this._columns[MutationTableColumnType.VAR_ALLELE] = {
            name: MutationTableColumnType.VAR_ALLELE,
            render: (d: Mutation[]) => getDivForDataField(d, 'variantAllele'),
            download: (d: Mutation[]) =>
                getTextForDataField(d, 'variantAllele'),
            sortBy: (d: Mutation[]) => d.map(m => m.variantAllele),
            visible: false,
        };

        this._columns[MutationTableColumnType.MUTATION_STATUS] = {
            name: MutationTableColumnType.MUTATION_STATUS,
            tooltip: <span>Mutation Status</span>,
            render: MutationStatusColumnFormatter.renderFunction,
            download: MutationStatusColumnFormatter.download,
            sortBy: MutationStatusColumnFormatter.sortValue,
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => defaultFilter(d, 'mutationStatus', filterStringUpper),
            visible: false,
        };

        this._columns[MutationTableColumnType.VALIDATION_STATUS] = {
            name: MutationTableColumnType.VALIDATION_STATUS,
            tooltip: <span>Validation Status</span>,
            render: ValidationStatusColumnFormatter.renderFunction,
            download: ValidationStatusColumnFormatter.download,
            sortBy: ValidationStatusColumnFormatter.sortValue,
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => defaultFilter(d, 'validationStatus', filterStringUpper),
            visible: false,
        };

        this._columns[MutationTableColumnType.CENTER] = {
            name: MutationTableColumnType.CENTER,
            render: (d: Mutation[]) => getDivForDataField(d, 'center'),
            download: (d: Mutation[]) => getTextForDataField(d, 'center'),
            sortBy: (d: Mutation[]) => d.map(m => m.center),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => defaultFilter(d, 'center', filterStringUpper),
            visible: false,
        };

        this._columns[MutationTableColumnType.GENE] = {
            name: MutationTableColumnType.GENE,
            render: (d: Mutation[]) => GeneColumnFormatter.renderFunction(d),
            download: (d: Mutation[]) => GeneColumnFormatter.getTextValue(d),
            sortBy: (d: Mutation[]) => GeneColumnFormatter.getSortValue(d),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                GeneColumnFormatter.getTextValue(d)
                    .toUpperCase()
                    .includes(filterStringUpper),
        };

        this._columns[MutationTableColumnType.CHROMOSOME] = {
            name: MutationTableColumnType.CHROMOSOME,
            render: (d: Mutation[]) => (
                <div className={generalStyles['integer-data']}>
                    {ChromosomeColumnFormatter.getData(d)}
                </div>
            ),
            download: (d: Mutation[]) =>
                ChromosomeColumnFormatter.getData(d) || '',
            sortBy: (d: Mutation[]) =>
                ChromosomeColumnFormatter.getSortValue(d),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                (ChromosomeColumnFormatter.getData(d) + '')
                    .toUpperCase()
                    .includes(filterStringUpper),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.PROTEIN_CHANGE] = {
            name: MutationTableColumnType.PROTEIN_CHANGE,
            render: ProteinChangeColumnFormatter.renderWithMutationStatus,
            download: ProteinChangeColumnFormatter.getTextValue,
            sortBy: (d: Mutation[]) =>
                ProteinChangeColumnFormatter.getSortValue(d),
            filter: ProteinChangeColumnFormatter.getFilterValue,
        };

        this._columns[MutationTableColumnType.MUTATION_TYPE] = {
            name: MutationTableColumnType.MUTATION_TYPE,
            render: MutationTypeColumnFormatter.renderFunction,
            download: MutationTypeColumnFormatter.getTextValue,
            sortBy: (d: Mutation[]) =>
                MutationTypeColumnFormatter.getDisplayValue(d),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                MutationTypeColumnFormatter.getDisplayValue(d)
                    .toUpperCase()
                    .includes(filterStringUpper),
        };

        this._columns[MutationTableColumnType.VARIANT_TYPE] = {
            name: MutationTableColumnType.VARIANT_TYPE,
            render: VariantTypeColumnFormatter.renderFunction,
            download: VariantTypeColumnFormatter.getTextValue,
            sortBy: (d: Mutation[]) =>
                VariantTypeColumnFormatter.getDisplayValue(d),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                VariantTypeColumnFormatter.getDisplayValue(d)
                    .toUpperCase()
                    .includes(filterStringUpper),
            visible: false,
        };

        this._columns[
            MutationTableColumnType.ASCN_METHOD
        ] = getDefaultASCNMethodColumnDefinition();

        this._columns[
            MutationTableColumnType.CANCER_CELL_FRACTION
        ] = getDefaultCancerCellFractionColumnDefinition();

        this._columns[
            MutationTableColumnType.CLONAL
        ] = getDefaultClonalColumnDefinition();

        this._columns[
            MutationTableColumnType.ASCN_COPY_NUM
        ] = getDefaultASCNCopyNumberColumnDefinition(
            undefined,
            this.props.sampleIdToClinicalDataMap
        );

        this._columns[
            MutationTableColumnType.EXPECTED_ALT_COPIES
        ] = getDefaultExpectedAltCopiesColumnDefinition();

        this._columns[MutationTableColumnType.FUNCTIONAL_IMPACT] = {
            name: MutationTableColumnType.FUNCTIONAL_IMPACT,
            render: (d: Mutation[]) => {
                if (
                    this.props.genomeNexusCache ||
                    this.props.genomeNexusMutationAssessorCache
                ) {
                    return FunctionalImpactColumnFormatter.renderFunction(
                        d,
                        this.props.genomeNexusCache,
                        this.props.genomeNexusMutationAssessorCache
                    );
                } else {
                    return <span></span>;
                }
            },
            download: (d: Mutation[]) =>
                FunctionalImpactColumnFormatter.download(
                    d,
                    this.props.genomeNexusCache as GenomeNexusCache,
                    this.props
                        .genomeNexusMutationAssessorCache as GenomeNexusMutationAssessorCache
                ),
            headerRender: FunctionalImpactColumnFormatter.headerRender,
            visible: false,
            shouldExclude: () => !this.props.enableFunctionalImpact,
        };

        this._columns[MutationTableColumnType.COSMIC] = {
            name: MutationTableColumnType.COSMIC,
            render: (d: Mutation[]) =>
                CosmicColumnFormatter.renderFunction(d, this.props.cosmicData),
            sortBy: (d: Mutation[]) =>
                CosmicColumnFormatter.getSortValue(d, this.props.cosmicData),
            download: (d: Mutation[]) =>
                CosmicColumnFormatter.getDownloadValue(
                    d,
                    this.props.cosmicData
                ),
            tooltip: <span>COSMIC occurrences</span>,
            defaultSortDirection: 'desc',
            align: 'right',
        };

        this._columns[MutationTableColumnType.ANNOTATION] = {
            name: MutationTableColumnType.ANNOTATION,
            headerRender: (name: string) =>
                AnnotationColumnFormatter.headerRender(name, this.oncokbWidth),
            render: (d: Mutation[]) => (
                <span id="mutation-annotation">
                    {AnnotationColumnFormatter.renderFunction(d, {
                        hotspotData: this.props.hotspotData,
                        myCancerGenomeData: this.props.myCancerGenomeData,
                        oncoKbData: this.props.oncoKbData,
                        oncoKbCancerGenes: this.props.oncoKbCancerGenes,
                        usingPublicOncoKbInstance: this.props
                            .usingPublicOncoKbInstance,
                        pubMedCache: this.props.pubMedCache,
                        civicGenes: this.props.civicGenes,
                        civicVariants: this.props.civicVariants,
                        enableCivic: this.props.enableCivic as boolean,
                        enableOncoKb: this.props.enableOncoKb as boolean,
                        enableMyCancerGenome: this.props
                            .enableMyCancerGenome as boolean,
                        enableHotspot: this.props.enableHotspot as boolean,
                        userEmailAddress: this.props.userEmailAddress,
                        resolveTumorType: this.resolveTumorType,
                    })}
                </span>
            ),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) => {
                let ret = false;
                switch (filterStringUpper) {
                    case 'HOTSPOT':
                        const annotation: IAnnotation = getAnnotationData(
                            d ? d[0] : undefined,
                            this.props.oncoKbCancerGenes,
                            this.props.hotspotData,
                            this.props.myCancerGenomeData,
                            this.props.oncoKbData,
                            this.props.usingPublicOncoKbInstance,
                            this.props.civicGenes,
                            this.props.civicVariants,
                            this.resolveTumorType
                        );

                        ret = annotation.isHotspot;
                        break;
                    case 'ONCOGENIC':
                        if (
                            this.props.oncoKbData &&
                            this.props.oncoKbData.result &&
                            !(this.props.oncoKbData.result instanceof Error) &&
                            this.props.oncoKbData.result.indicatorMap
                        ) {
                            const queryId = generateQueryVariantId(
                                d[0].entrezGeneId,
                                null,
                                d[0].proteinChange,
                                d[0].mutationType
                            );
                            const indicator = this.props.oncoKbData.result
                                .indicatorMap[queryId];
                            if (indicator) {
                                ret = indicator.oncogenic
                                    .toLowerCase()
                                    .trim()
                                    .includes('oncogenic');
                            }
                        }
                        break;
                }
                return ret;
            },
            download: (d: Mutation[]) => {
                return AnnotationColumnFormatter.download(
                    d,
                    this.props.oncoKbCancerGenes,
                    this.props.hotspotData,
                    this.props.myCancerGenomeData,
                    this.props.oncoKbData,
                    this.props.usingPublicOncoKbInstance,
                    this.props.civicGenes,
                    this.props.civicVariants,
                    this.resolveTumorType
                );
            },
            sortBy: (d: Mutation[]) => {
                return AnnotationColumnFormatter.sortValue(
                    d,
                    this.props.oncoKbCancerGenes,
                    this.props.hotspotData,
                    this.props.myCancerGenomeData,
                    this.props.oncoKbData,
                    this.props.usingPublicOncoKbInstance,
                    this.props.civicGenes,
                    this.props.civicVariants,
                    this.resolveTumorType
                );
            },
        };

        this._columns[MutationTableColumnType.HGVSG] = {
            name: MutationTableColumnType.HGVSG,
            render: (d: Mutation[]) =>
                HgvsgColumnFormatter.renderFunction(
                    d,
                    this.props.generateGenomeNexusHgvsgUrl
                ),
            download: (d: Mutation[]) => HgvsgColumnFormatter.download(d),
            sortBy: (d: Mutation[]) => HgvsgColumnFormatter.getSortValue(d),
            visible: false,
            align: 'left',
        };

        this._columns[MutationTableColumnType.CANCER_TYPE_DETAILED] = {
            id: 'CANCER_TYPE_DETAILED',
            name: MutationTableColumnType.CANCER_TYPE_DETAILED,
            render: (d: Mutation[]) =>
                CancerTypeColumnFormatter.render(
                    d,
                    this.props.uniqueSampleKeyToTumorType
                ),
            download: (d: Mutation[]) =>
                CancerTypeColumnFormatter.download(
                    d,
                    this.props.uniqueSampleKeyToTumorType
                ),
            sortBy: (d: Mutation[]) =>
                CancerTypeColumnFormatter.sortBy(
                    d,
                    this.props.uniqueSampleKeyToTumorType
                ),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                CancerTypeColumnFormatter.filter(
                    d,
                    filterStringUpper,
                    this.props.uniqueSampleKeyToTumorType
                ),
            tooltip: <span>Cancer Type Detailed</span>,
            resizable: true,
            truncateOnResize: true,
        };

        this._columns[MutationTableColumnType.NUM_MUTATIONS] = {
            id: 'MUTATION_COUNT',
            name: MutationTableColumnType.NUM_MUTATIONS,
            render: MutationCountColumnFormatter.makeRenderFunction(this),
            headerRender: (name: string) => (
                <span style={{ display: 'inline-block', maxWidth: 55 }}>
                    {name}
                </span>
            ),
            sortBy: (d: Mutation[]) =>
                MutationCountColumnFormatter.sortBy(
                    d,
                    this.props.mutationCountCache
                ),
            download: (d: Mutation[]) =>
                MutationCountColumnFormatter.download(
                    d,
                    this.props.mutationCountCache
                ),
            tooltip: (
                <span>
                    Total number of nonsynonymous mutations in the sample
                </span>
            ),
            align: 'right',
        };

        this._columns[MutationTableColumnType.EXON] = {
            name: MutationTableColumnType.EXON,
            render: (d: Mutation[]) =>
                this.props.genomeNexusCache ? (
                    ExonColumnFormatter.renderFunction(
                        d,
                        this.props.genomeNexusCache
                    )
                ) : (
                    <span></span>
                ),
            download: (d: Mutation[]) =>
                ExonColumnFormatter.download(
                    d,
                    this.props.genomeNexusCache as GenomeNexusCache
                ),
            sortBy: (d: Mutation[]) =>
                ExonColumnFormatter.getSortValue(
                    d,
                    this.props.genomeNexusCache as GenomeNexusCache
                ),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.HGVSC] = {
            name: MutationTableColumnType.HGVSC,
            render: (d: Mutation[]) =>
                this.props.indexedVariantAnnotations ? (
                    HgvscColumnFormatter.renderFunction(
                        d,
                        this.props.indexedVariantAnnotations,
                        this.props.selectedTranscriptId
                    )
                ) : (
                    <span />
                ),
            download: (d: Mutation[]) =>
                HgvscColumnFormatter.download(
                    d,
                    this.props.indexedVariantAnnotations,
                    this.props.selectedTranscriptId
                ),
            sortBy: (d: Mutation[]) =>
                HgvscColumnFormatter.getSortValue(
                    d,
                    this.props.indexedVariantAnnotations,
                    this.props.selectedTranscriptId
                ),
            visible: false,
            align: 'right',
        };

        this._columns[MutationTableColumnType.GNOMAD] = {
            name: MutationTableColumnType.GNOMAD,
            render: (d: Mutation[]) =>
                GnomadColumnFormatter.renderFunction(
                    d,
                    this.props.indexedVariantAnnotations,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            sortBy: (d: Mutation[]) =>
                GnomadColumnFormatter.getSortValue(
                    d,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            download: (d: Mutation[]) =>
                GnomadColumnFormatter.download(
                    d,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            tooltip: (
                <span>
                    <a href="https://gnomad.broadinstitute.org/">gnomAD</a>{' '}
                    population allele frequencies. Overall population allele
                    frequency is shown. Hover over a frequency to see the
                    frequency for each specific population.
                </span>
            ),
            defaultSortDirection: 'desc',
            visible: false,
            align: 'left',
        };

        this._columns[MutationTableColumnType.CLINVAR] = {
            name: MutationTableColumnType.CLINVAR,
            render: (d: Mutation[]) =>
                ClinvarColumnFormatter.renderFunction(
                    d,
                    this.props.indexedVariantAnnotations
                ),
            sortBy: (d: Mutation[]) =>
                ClinvarColumnFormatter.getSortValue(
                    d,
                    this.props.indexedVariantAnnotations
                ),
            download: (d: Mutation[]) =>
                ClinvarColumnFormatter.download(
                    d,
                    this.props.indexedVariantAnnotations
                ),
            tooltip: (
                <span>
                    <a
                        href="https://www.ncbi.nlm.nih.gov/clinvar/"
                        target="_blank"
                    >
                        ClinVar
                    </a>
                    &nbsp;aggregates information about genomic variation and its
                    relationship to human health.
                </span>
            ),
            defaultSortDirection: 'desc',
            visible: false,
            align: 'left',
        };

        this._columns[MutationTableColumnType.DBSNP] = {
            name: MutationTableColumnType.DBSNP,
            render: (d: Mutation[]) =>
                DbsnpColumnFormatter.renderFunction(
                    d,
                    this.props.indexedVariantAnnotations,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            sortBy: (d: Mutation[]) =>
                DbsnpColumnFormatter.getSortValue(
                    d,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            download: (d: Mutation[]) =>
                DbsnpColumnFormatter.download(
                    d,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            filter: (
                d: Mutation[],
                filterString: string,
                filterStringUpper: string
            ) =>
                DbsnpColumnFormatter.filter(
                    d,
                    filterStringUpper,
                    this.props.indexedMyVariantInfoAnnotations
                ),
            tooltip: (
                <span
                    style={{
                        maxWidth: 370,
                        display: 'block',
                        textAlign: 'left',
                    }}
                >
                    The Single Nucleotide Polymorphism Database (
                    <a href="https://www.ncbi.nlm.nih.gov/snp/" target="_blank">
                        dbSNP
                    </a>
                    ) is a free public archive for genetic variation within and
                    across different species.
                    <br />
                    NOTE: Currently only SNPs, single base deletions and
                    insertions are supported.
                </span>
            ),
            defaultSortDirection: 'desc',
            visible: false,
            align: 'right',
        };
        this._columns[MutationTableColumnType.SIGNAL] = {
            name: MutationTableColumnType.SIGNAL,
            render: (d: Mutation[]) =>
                SignalColumnFormatter.renderFunction(
                    d,
                    this.props.indexedVariantAnnotations
                ),
            sortBy: (d: Mutation[]) =>
                SignalColumnFormatter.getSortValue(
                    d,
                    this.props.indexedVariantAnnotations
                ),
            download: (d: Mutation[]) =>
                SignalColumnFormatter.download(
                    d,
                    this.props.indexedVariantAnnotations
                ),
            tooltip: (
                <span
                    style={{
                        maxWidth: 370,
                        display: 'block',
                        textAlign: 'left',
                    }}
                >
                    Prevalence of germline mutations in cancer patients from{' '}
                    <a href="https://www.signaldb.org/" target="_blank">
                        SIGNAL
                    </a>
                </span>
            ),
            visible: false,
            shouldExclude: () => !getServerConfig().show_signal,
        };
    }

    @computed
    protected get orderedColumns(): ExtendedMutationTableColumnType[] {
        const columns = this.props.columns || [];
        return _.sortBy(columns, (c: ExtendedMutationTableColumnType) => {
            let order: number = -1;

            if (this._columns[c] && this._columns[c].order) {
                order = this._columns[c].order as number;
            }

            return order;
        });
    }

    @computed protected get columns(): Column<Mutation[]>[] {
        return this.orderedColumns.reduce(
            (
                columns: Column<Mutation[]>[],
                next: ExtendedMutationTableColumnType
            ) => {
                let column = this._columns[next];

                if (
                    column && // actual column definition may be missing for a specific enum
                    (!column.shouldExclude || !column.shouldExclude())
                ) {
                    columns.push(column);
                }

                return columns;
            },
            []
        );
    }

    public render() {
        return (
            <MutationTableComponent
                ref={this.tableRef}
                columns={this.columns}
                data={this.props.data}
                dataStore={this.props.dataStore}
                downloadDataFetcher={this.props.downloadDataFetcher}
                initialItemsPerPage={this.props.initialItemsPerPage}
                initialSortColumn={this.props.initialSortColumn}
                initialSortDirection={this.props.initialSortDirection}
                itemsLabel={this.props.itemsLabel}
                itemsLabelPlural={this.props.itemsLabelPlural}
                paginationProps={this.props.paginationProps}
                showCountHeader={this.props.showCountHeader}
                columnVisibility={this.props.columnVisibility}
                columnVisibilityProps={this.props.columnVisibilityProps}
                storeColumnVisibility={this.props.storeColumnVisibility}
                onRowClick={this.props.onRowClick}
                onRowMouseEnter={this.props.onRowMouseEnter}
                onRowMouseLeave={this.props.onRowMouseLeave}
                columnToHeaderFilterIconModal={
                    this.props.columnToHeaderFilterIconModal
                }
                deactivateColumnFilter={this.props.deactivateColumnFilter}
            />
        );
    }
}
