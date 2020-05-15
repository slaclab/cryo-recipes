import React from 'react';
import './App.css';

import { Navbar, Nav, Card } from 'react-bootstrap';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import { Stage } from 'ngl';
import Slider from 'rc-slider';

import {RIEInput, RIEToggle, RIETextArea, RIENumber, RIETags, RIESelect} from 'riek';

import { Button } from 'react-bootstrap'

import DropdownButton from 'react-bootstrap/DropdownButton'
import Dropdown from 'react-bootstrap/Dropdown'

import { DeepDiff } from 'deep-diff';

import {
  SortingState,
  IntegratedSorting,
  SearchState,
  RowDetailState,
  FilteringState, IntegratedFiltering,
  // DataTypeProvider
} from '@devexpress/dx-react-grid';
import {
  Grid,
  Table,
  // VirtualTable,
  TableHeaderRow,
  TableEditColumn,
  TableColumnVisibility,
  ColumnChooser,
  Toolbar,
  TableRowDetail,
  TableFilterRow,
  SearchPanel

} from '@devexpress/dx-react-grid-bootstrap4';

import { Fab, Action } from 'react-tiny-fab';
import 'react-tiny-fab/dist/styles.css';

class Navigation extends React.Component {
  render() {
    return (
      <Navbar className="navbar-custom" variant="dark">
        <Navbar.Brand href="#home">
          <img
            alt=""
            src="/slac_small.png"
            className="d-inline-block align-top"
          />
        {' CryoEM Recipes - Membrane Protein Database'}
        </Navbar.Brand>
        <Navbar.Brand href="https://gati-lab.slac.stanford.edu">
          <img
            alt=""
            src=""
            className="d-inline-block align-right"
          />
        {'Gati lab'}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    )
  }
}


class PapersDataComponent extends React.Component {

  constructor( props ){
    super(props);
    this.state = {
      papers: [],
    }
  }

  componentDidMount() {
    console.log('fetching '+process.env.REACT_APP_DB_SERVER+'/api/papers.json');
    fetch( process.env.REACT_APP_DB_SERVER + '/api/papers.json' )
      .then( results => results.json() )
      .then( data => {
        const papers = data;
        this.setState( { papers });
      }).catch( err => console.log(err) )
  }

  renderer( data ) {
    console.log(data);
    return(<p>hello</p>)
  }

}

class MapViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: props.style || {
        width: "100%",
        height: "22em",
        display: 'inline-block', position: 'relative',
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      },
      stage: null,
      reprPdb: null,
      sliderEmdbDisabled: true,
      reprEmdb: null,
      emdb: props.emdb || null,
      pdb: props.pdb || null,
      id: 'PDB-' + props.pdb + '--EMD-' + props.emdb
    }
  }

  loadPdb( stage, pdb, visibility=false, pdb_url=`https://files.rcsb.org/download/${pdb}.pdb` ){
    console.log('loading structural map ' + pdb_url );
    stage.loadFile( pdb_url )
    .then( repr => {
      console.log( repr );
      this.reprPdb = repr.addRepresentation( 'cartoon' );
      stage.autoView();
    })
    .catch( e => {
      console.error(e)
    });
    return stage
  }

  loadEmdb( stage, emdb, opacity=0.6, isolevel=2, colour="#33ABF9", emdb_url=`https://files.rcsb.org/pub/emdb/structures/EMD-${emdb}/map/emd_${emdb}.map.gz` ){
    console.log( 'loading density map ' + emdb_url );
    stage.loadFile( emdb_url, {useWorker: true}  )
    .then( repr => {
      this.reprEmdb = repr.addRepresentation( "surface", {
        color: colour,
        //depthWrite: true,
        isolevel: isolevel,
        opacity: opacity,
        side: "front",
        //wireframe: wireframe,
      })
      setTimeout( () => {
        console.log('loaded density map')
        stage.autoView();
        this.setState( { sliderEmdbDisabled: false } )
      }, 1000 );
    }).catch( e => {
      console.error(e)
    });
  }

  componentDidMount() {
    var stage = new Stage(this.state.id);
    stage.setParameters( {backgroundColor: "white"} )
    if ( this.state.pdb ) {
      this.loadPdb( stage, this.state.pdb )
    }
    if ( this.state.emdb ) {
      this.loadEmdb( stage, this.state.emdb )
    }
    this.setState( { stage: stage } )
  }

  changeEmdbOpacity = (value) => {
    this.reprEmdb.setParameters( { opacity: value } );
  }

  changeEmdbIsolevel = (value) => {
    this.reprEmdb.setParameters( { isolevel: value } );
  }

  render() {

    return(
        <Container>
          <Row>
            <Col>Map Opacity</Col>
            <Col align={'right'}><Slider  min={0} max={1} step={0.01} onChange={this.changeEmdbOpacity} defaultValue={0.6} disabled={this.state.sliderEmdbDisabled}/></Col>
          </Row>
          <Row>
            <Col>Map Isolevel</Col>
            <Col align={'right'}><Slider  min={-5} max={5} step={0.1} onChange={this.changeEmdbIsolevel} defaultValue={2} disabled={this.state.sliderEmdbDisabled}/></Col>
          </Row>
          <Row>
            <Col><div id={ this.state.id } style={ this.state.style }></div></Col>
          </Row>
        </Container>
    )
  }
}


class Detail extends React.Component {

  constructor( props ){
    super(props);
    this.state = props.data
    this.state.editing = false;
  }

  componentDidMount() {
    // console.log( this.state );
  }

  virtualServerCallback = (newState) => {
    this.changeState(newState);
    // console.log( newState);
  }

  changeState = (newState) => {
    // console.log( newState );
    this.setState( newState );
  }

  isOkay = (s) => {
    return true
  }


  editButton = (evt) => {
    console.log(evt);
    this.setState( { editing: ! this.state.editing }, (evt) => {
      //  new document
      if( ! this.state.editing ) {
        console.log( 'submitting..' );
        var doc = {...this.state};
        delete doc.editing
        const orig = {...doc.original};
        delete orig.editing;
        delete doc.original
        //console.log( orig )
        //console.log( doc )
        let differences = DeepDiff( orig, doc );
        console.log( differences )
      }
      // copy original
      else {
        // only do it once per session to allow user to make multiple changes
        if( !('original' in this.state) ){
          console.log('making original copy of state')
          this.setState( { original: {...this.state} } );
        }
      }
    });
  }

  isStringAcceptable = (value) => {
    // console.log(value);
    return true;
  }

  fieldChanged = (evt) => {
    console.log(evt);
    Object.entries( evt ).forEach( (tuple) => {
      const k = tuple[0];
      const v = tuple[1];
      // deal with nested
      if( k.includes('.') ){
        const nest = k.split('.');
        const x = nest[0]
        const i = nest[1]
        const newK = {...this.state[x], [i]: v };
        this.setState( { [x]: newK }, () => {
          console.log( this.state );
        });
      } else {
        this.setState(evt);
      }
    })
  }


  formatAngstrom = (v) => {
    console.log("formatting " + v)
    return v + ' Å';
  }


  formatSeconds = (v) => {
    return v + " s";
  }

  formatDose = (v) => {
    return v + ' e-/Å^2';
  }

  render() {
    return(

    <Card border="secondary">
      <Card.Header>
         <Container>
           <Row>
             <Col><h3>Paper { this.state.publication.doi }</h3></Col>
           </Row>
         </Container>
      </Card.Header>
      <Card.Body>
        <Container>
          <Row>
            <Col>
              <Card.Title>
                Info
              </Card.Title>
              <table>
                <tbody>
                  <tr><td>gene</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="gene" value={this.state.gene} /></td></tr>
                  <tr><td>name</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="name" value={this.state.name} /></td></tr>
                  <tr><td>in_complex_with</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="in_complex_with" value={this.state.in_complex_with} /></td></tr>
                  <tr><td>type</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="type" value={this.state.type} /></td></tr>
                  <tr><td>native_source</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="native_source" value={this.state.native_source} /></td></tr>
                  <tr><td>particle_size</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="particle_size" value={this.state.particle_size} /></td></tr>
                  <tr><td>monomer</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="monomer" value={this.state.monomer} /></td></tr>
                  <tr><td>oligomer</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="oligomer" value={this.state.oligomer} /></td></tr>
                  <tr><td>monomer_tmd_helices</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="monomer_tmd_helices" value={this.state.monomer_tmd_helices} /></td></tr>
                  <tr><td>helices_tmd_oligomer</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="helices_tmd_oligomer" value={this.state.helices_tmd_oligomer} /></td></tr>
                  <tr><td>affinity_tag_cleavage</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="affinity_tag_cleavage" value={this.state.affinity_tag_cleavage} /></td></tr>
                  <tr><td>final_stabilizer</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="final_stabilizer" value={this.state.final_stabilizer} /></td></tr>
                  <tr><td>notes</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="notes" value={this.state.notes} /></td></tr>

                </tbody>
              </table>
            </Col>
            <Col>
              <Card.Title>
                Publication
              </Card.Title>
              <div className="viewer">
                <MapViewer pdb={ this.state.publication.pdb } emdb={ this.state.publication.emdb } />
              </div>
              <table>
                <tbody>
                  <tr><td>year_published</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="publication.year_published" value={ this.state.publication.year_published } /></td></tr>
                  <tr><td>doi</td><td><a href={ "https://www.doi.org/"+ this.state.publication.doi }><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="publication.doi" value={ this.state.publication.doi } /></a></td></tr>
                  <tr><td>pdb</td><td><a href={ "https://www.rcsb.org/structure/"+ this.state.publication.pdb }>{ this.state.publication.pdb }</a></td></tr>
                  <tr><td>emdb</td><td><a href={ "http://www.ebi.ac.uk/pdbe/entry/emdb/" + this.state.publication.emdb}>{ this.state.publication.emdb }</a></td></tr>
                </tbody>
              </table>
            </Col>
          </Row>
          <Row>
            <Col>
              <Card.Title>
                Sample Preparation
              </Card.Title>
              <table>
                <tbody>
                  <tr><td>expression_organism</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.expression_organism" value={this.state.sample_preparation.expression_organism} /></td></tr>
                  <tr><td>stabilizer_exchange</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.stabilizer_exchange" value={this.state.sample_preparation.stabilizer_exchange} /></td></tr>
                  <tr><td>extraction_method</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.extraction_method" value={this.state.sample_preparation.extraction_method} /></td></tr>
                  <tr><td>extraction_concentration</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.extraction_concentration" value={this.state.sample_preparation.extraction_concentration} /></td></tr>
                  <tr><td>extraction_parameters</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.extraction_parameters" value={this.state.sample_preparation.extraction_parameters} /></td></tr>
                  <tr><td>affinity_tag_terminus</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.affinity_tag_terminus" value={this.state.sample_preparation.affinity_tag_terminus} /></td></tr>
                  <tr><td>initial_purification</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.initial_purification" value={this.state.sample_preparation.initial_purification} /></td></tr>
                  <tr><td>purification_details</td><td><RIETextArea isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.purification_details" value={this.state.sample_preparation.purification_details} /></td></tr>
                  <tr><td>composition_of_final_stabilizer</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.composition_of_final_stabilizer" value={this.state.sample_preparation.composition_of_final_stabilizer} /></td></tr>
                  <tr><td>final_concentration_or_ratio</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.final_concentration_or_ratio" value={this.state.sample_preparation.final_concentration_or_ratio} /></td></tr>
                  <tr><td>final_purification</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="sample_preparation.final_purification" value={this.state.sample_preparation.final_purification} /></td></tr>
                </tbody>
              </table>
            </Col>
            <Col>
              <Card.Title>
                Grid Preparation
              </Card.Title>
              <table>
                <tbody>
                  <tr><td>grid protein concentration</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="grid_preparation.grid_protein_concentration" value={this.state.grid_preparation.grid_protein_concentration} /></td></tr>
                  <tr><td>details</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="grid_preparation.details" value={this.state.grid_preparation.details} /></td></tr>
                  <tr><td>comments</td><td><RIETextArea isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="grid_preparation.comments" value={this.state.grid_preparation.comments} /></td></tr>
                </tbody>
              </table>
            </Col>
          </Row>
          <Row>
            <Col>
              <Card.Title>
                Imaging Conditions
              </Card.Title>
              <table>
                <tbody>
                  <tr><td>detector</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.detector" value={this.state.imaging_conditions.detector} /></td></tr>
                  <tr><td>keV</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.keV" value={this.state.imaging_conditions.keV} /></td></tr>
                  <tr><td>total_dose</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.total_dose" value={this.state.imaging_conditions.total_dose} format={ this.formatDose } /></td></tr>
                  <tr><td>frame_duration</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.frame_duration" value={this.state.imaging_conditions.frame_duration} format={ this.formatSeconds } /></td></tr>
                  <tr><td>total_exposure_time</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.total_exposure_time" value={this.state.imaging_conditions.total_exposure_time} format={ this.formatSeconds }/></td></tr>
                  <tr><td>pixel_size</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.pixel_size" value={this.state.imaging_conditions.pixel_size} format={ this.formatAngstrom }/></td></tr>
                  <tr><td>super_resolution</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.super_resolution" value={this.state.imaging_conditions.super_resolution} /></td></tr>
                  <tr><td>energy_filter</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.energy_filter" value={this.state.imaging_conditions.energy_filter} /></td></tr>
                  <tr><td>vpp</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.vpp" value={this.state.imaging_conditions.vpp} /></td></tr>
                  <tr><td>cs_corrector</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.cs_corrector" value={this.state.imaging_conditions.cs_corrector} /></td></tr>
                </tbody>
              </table>
            </Col>
            <Col>
              <Card.Title>
                Software
              </Card.Title>
              <table>
                <tbody>
                  <tr><td>symmetry_applied</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.symmetry_applied" value={this.state.imaging_conditions.symmetry_applied} /></td></tr>
                  <tr><td>total_number_images</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.total_number_images" value={this.state.imaging_conditions.total_number_images} /></td></tr>
                  <tr><td>final_number_particles</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.final_number_particles" value={this.state.imaging_conditions.final_number_particles} /></td></tr>
                  <tr><td>software</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.software" value={this.state.imaging_conditions.software} /></td></tr>
                  <tr><td>resolution</td><td><RIEInput isDisabled={!this.state.editing} validate={this.isStringAcceptable} change={this.fieldChanged} propName="imaging_conditions.resolution" value={this.state.imaging_conditions.resolution} /></td></tr>
                </tbody>
              </table>
            </Col>
          </Row>
        </Container>
      </Card.Body>
    </Card>

    )
  }
}

const FilterIcon = ({ type }) => {
  if (type === 'month') {
    return (
      <span
        className="d-block oi oi-calendar"
      />
    );
  }
  return <TableFilterRow.Icon type={type} />;
};

class PapersGrid extends PapersDataComponent {

  getRowId( row ) {
    return row.id;
  }

  getDetail( {row} ) {
    console.log( row );
    return( <Detail data={ row } /> )
  }

  constructor( props ) {
    super(props);
    this.state.columns = [
      { name: 'type', title: 'Type' },
      { name: 'gene', title: 'Gene' },
      { name: 'native_source', title: 'Native Source' },
      { name: 'particle_size', title: 'Particle Size' },
      { name: 'monomer', title: 'Monomer' },
      { name: 'oligomer', title: 'Oligomer' },
      { name: 'monomer_tmd_helices', title: 'Monomer tmd helices' },
      { name: 'helices_tmd_oligomer', title: 'Helices tmd Oligomer' },
      { name: 'affinity_tag_cleavage', title: 'Affinity Tag Cleavage' },
      { name: 'final_stabilizer', title: 'Final Stabilizer' },

      { name: 'expression_organism', title: 'Expression Organism', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.expression_organism : undefined ) },
      { name: 'extraction_method', title: 'Extraction Method', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.extraction_method : undefined ) },
      { name: 'extraction_concentration', title: 'Extraction Concentration', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.extraction_concentration : undefined ) },
      { name: 'extraction_parameters', title: 'Extraction Parameters', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.extraction_parameters : undefined ) },
      { name: 'affinity_tag_terminus', title: 'Affinity Tag Terminus', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.affinity_tag_terminus : undefined ) },
      { name: 'initial_purification', title: 'Initial Purification', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.initial_purification : undefined ) },
      { name: 'stabilizer_exchange', title: 'Stabilizer Exchange', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.stabilizer_exchange : undefined ) },
      { name: 'purification_details', title: 'Purification Details', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.purification_details : undefined ) },
      { name: 'composition_of_final_stabilizer', title: 'Composition of Final Stabilizer', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.composition_of_final_stabilizer : undefined ) },
      { name: 'final_concentration_or_ratio', title: 'Final Concentration Or Ratio', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.final_concentration_or_ratio : undefined ) },
      { name: 'final_purification', title: 'Final Purification', getCellValue: row => ( row.sample_preparation ? row.sample_preparation.final_purification : undefined ) },

      { name: 'grid_protein_concentration', title: 'Grid Protein Concentration', getCellValue: row => ( row.grid_preparation ? row.grid_preparation.grid_protein_concentration : undefined ) },
      { name: 'grid_details', title: 'Grid Details', getCellValue: row => ( row.grid_preparation ? row.grid_preparation.details : undefined ) },

      { name: 'detector', title: 'Detector', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.detector : undefined ) },
      { name: 'keV', title: 'keV', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.keV : undefined ) },
      { name: 'total_dose', title: 'Total Dose', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.total_dose : undefined ) },
      { name: 'frame_duration', title: 'Frame Duration', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.frame_duration : undefined ) },
      { name: 'total_exposure_time', title: 'Total Exposure Time', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.total_exposure_time : undefined ) },
      { name: 'pixel_size', title: 'Pixel Size', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.pixel_size : undefined ) },
      { name: 'super_resolution', title: 'Super Resolution', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.super_resolution : undefined ) },
      { name: 'energy_filter', title: 'Energy Filter', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.energy_filter : undefined ) },
      { name: 'vpp', title: 'VPP', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.vpp : undefined ) },
      { name: 'cs_corrector', title: 'CS Corrector', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.cs_corrector : undefined ) },

      { name: 'symmetry_applied', title: 'Symmetry Applied', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.symmetry_applied : undefined ) },
      { name: 'total_number_images', title: 'Total Number Images', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.total_number_images : undefined ) },
      { name: 'final_number_particles', title: 'Final Number Particles', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.final_number_particles : undefined ) },
      { name: 'software', title: 'Software', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.software : undefined ) },

      { name: 'resolution', title: 'Resolution', getCellValue: row => ( row.imaging_conditions ? row.imaging_conditions.resolution : undefined ) },
    ]
    this.state.hiddenColumnNames = [
      'monomer',
      'oligomer',
      'monomer_tmp_helices',
      'helices_tmp_oligomer',
      'affinity_tag_cleavage',
      // 'final_stabilizer',
      'expression_organism',
      'extraction_method',
      'extraction_concentration',
      'extraction_parameters',
      'affinity_tag_terminus',
      'initial_purification',
      'stabilizer_exchange',
      'purification_details',
      'composition_of_final_stabilizer',
      'final_concentration_or_ratio',
      'final_purification',
      'grid_protein_concentration',
      'grid_details',
      'detector',
      'keV',
      'total_dose',
      'frame_duration',
      'total_exposure_time',
      'pixel_size',
      'super_resolution',
      'energy_filter',
      'vpp',
      'cs_corrector',
      'symmetry_applied',
      'total_number_images',
      'final_number_particles',
      'software',

    ]

    this.hiddenColumnNamesChange = (hiddenColumnNames) => {
      this.setState({ hiddenColumnNames });
    };

  }

  render() {
    const { hiddenColumnNames } = this.state
    return(
      <div className="card">
        <Grid
          rows={this.state.papers}
          columns={this.state.columns}
          getRowId={this.getRowId}>
          <SearchState />
          <RowDetailState />
          <SortingState
            defaultSorting={[{ columnName: 'type', direction: 'asc' }]}
          />
          <IntegratedSorting />
          <FilteringState defaultFilters={[]} />
          <IntegratedFiltering />
          <Table height="auto"/>
          <TableHeaderRow showSortingControls />
          <TableRowDetail
            contentComponent={ this.getDetail } />
          <TableColumnVisibility
            defaultHiddenColumnNames={ hiddenColumnNames }
            onHiddenColumnNamesChange={this.hiddenColumnNamesChange}
          />
          <Toolbar />
          <SearchPanel />
          <TableFilterRow
            showFilterSelector
            iconComponent={FilterIcon}
          />
          <ColumnChooser />
        </Grid>
      </div>
    )
  }
}

class App extends PapersDataComponent {
  
  render() {
    return (
      <div>
        <Navigation />
        <PapersGrid />
        <Fab icon="+" mainButtonStyles={{backgroundColor: '#27ae60'}} onClick={ e => {console.log(e)}}/>
      </div>
    );
  }
}

export default App;
