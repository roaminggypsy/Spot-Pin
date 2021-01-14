import React, { useState } from 'react';
import MapGL, { NavigationControl } from 'react-map-gl';
import { withStyles } from '@material-ui/core/styles';
// import Button from "@material-ui/core/Button";
// import Typography from "@material-ui/core/Typography";
// import DeleteIcon from "@material-ui/icons/DeleteTwoTone";

const INITIAL_VIEWPORT = {
  latitude: 37.7577,
  longitude: -122.4376,
  zoom: 1,
};

const Map = ({ classes }) => {
  const [viewport, setViewport] = useState({
    latitude: 37.8,
    longitude: -122.4,
    zoom: 14,
    bearing: 0,
    pitch: 0,
  });

  return (
    <MapGL
      {...viewport}
      width='100vw'
      height='100vh'
      mapStyle='mapbox://styles/mapbox/dark-v9'
      mapboxApiAccessToken='pk.eyJ1IjoibGlwYWR1cGEiLCJhIjoiY2tqd2YzbWQwMDk2cTJ5cGYwdGVnam5nYyJ9.J15bYPm3-NnsFxPXUCSJbw'
      onViewportChange={(newViewport) => setViewport(newViewport)}
    >
      <div className={classes.navigationControl}>
        <NavigationControl
          onViewportChange={(newViewport) => setViewport(newViewport)}
        />
      </div>
    </MapGL>
  );
};

const styles = {
  root: {
    display: 'flex',
  },
  rootMobile: {
    display: 'flex',
    flexDirection: 'column-reverse',
  },
  navigationControl: {
    position: 'absolute',
    top: 0,
    left: 0,
    margin: '1em',
  },
  deleteIcon: {
    color: 'red',
  },
  popupImage: {
    padding: '0.4em',
    height: 200,
    width: 200,
    objectFit: 'cover',
  },
  popupTab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
};

export default withStyles(styles)(Map);
