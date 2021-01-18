import React, { useState, useEffect, useContext } from 'react';
import MapGL, { NavigationControl, Marker, Popup } from 'react-map-gl';
import { withStyles } from '@material-ui/core/styles';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import DeleteIcon from '@material-ui/icons/DeleteTwoTone';
import { useClient } from '../client';
import { GET_PINS_QUERY } from '../graphql/queries';
import { DELETE_PIN_MUTATION } from '../graphql/mutations';
import PinIcon from './PinIcon';
import Context from '../context';
import Blog from './Blog';
import { Subscription } from 'react-apollo';
import {
  PIN_ADDED_SUBSCRIPTION,
  PIN_UPDATED_SUBSCRIPTION,
  PIN_DELETED_SUBSCRIPTION,
} from '../graphql/subscriptions';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const INITIAL_VIEWPORT = {
  latitude: 37.7577,
  longitude: -122.4376,
  zoom: 1,
};

const Map = ({ classes }) => {
  const client = useClient();
  const mobileSize = useMediaQuery('(max-width: 650px)');
  const { state, dispatch } = useContext(Context);
  useEffect(() => {
    getPins();
  }, []);

  const [viewport, setViewport] = useState({
    latitude: 37.8,
    longitude: -122.4,
    zoom: 14,
    bearing: 0,
    pitch: 0,
  });

  const [userPos, setUserPos] = useState(null);

  useEffect(() => {
    getUserPos();
  }, []);

  const [popup, setPopup] = useState(null);
  // remove popup if pin itself is detected by the author of the pin
  useEffect(() => {
    const pinExists =
      popup && state.pins.findIndex((pin) => pin._id === popup._id) > -1;
    if (!pinExists) {
      setPopup(null);
    }
  }, [state.pins.length]);

  const getPins = async () => {
    const { getPins } = await client.request(GET_PINS_QUERY);
    dispatch({ type: 'GET_PINS', payload: getPins });
    console.log({ getPins });
  };

  const getUserPos = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setViewport({ ...viewport, latitude, longitude });
        setUserPos({ latitude, longitude });
      });
    }
  };

  const handleMapClick = ({ lngLat, leftButton }) => {
    if (!leftButton) {
      return;
    }
    if (!state.draft) {
      dispatch({ type: 'CREATE_DRAFT' });
    }

    const [longitude, latitude] = lngLat;
    dispatch({
      type: 'UPDATE_DRAFT_LOCATION',
      payload: { longitude, latitude },
    });
  };

  const highlightNewPin = (pin) => {
    const isNewPin =
      differenceInMinutes(Date.now(), Number(pin.createdAt)) <= 30;
    return isNewPin ? 'limegreen' : 'darkblue';
  };

  const handleSelectPin = (pin) => {
    setPopup(pin);

    dispatch({ type: 'SET_PIN', payload: pin });
  };

  const handleDeletePin = async (pin) => {
    const variables = { pinId: pin._id };
    await client.request(DELETE_PIN_MUTATION, variables);
    setPopup(null);
  };

  const isAuthUser = () => state.currentUser._id === popup.author._id;

  return (
    <div className={mobileSize ? classes.rootMobile : classes.root}>
      <MapGL
        {...viewport}
        width='100vw'
        height='100vh'
        mapStyle='mapbox://styles/mapbox/dark-v9'
        mapboxApiAccessToken='pk.eyJ1IjoibGlwYWR1cGEiLCJhIjoiY2tqd2YzbWQwMDk2cTJ5cGYwdGVnam5nYyJ9.J15bYPm3-NnsFxPXUCSJbw'
        scrollZoom={!mobileSize}
        onViewportChange={(newViewport) => setViewport(newViewport)}
        onClick={handleMapClick}
      >
        {/* /Navigation Control */}
        <div className={classes.navigationControl}>
          <NavigationControl
            onViewportChange={(newViewport) => setViewport(newViewport)}
          />
        </div>

        {/* Pin for User's Current Pos */}
        {userPos && (
          <Marker
            latitude={userPos.latitude}
            longitude={userPos.longitude}
            offsetLeft={-19}
            offsetTop={-37}
          >
            <PinIcon size={40} color='red' />
          </Marker>
        )}

        {/* Draft Pin */}
        {state.draft && (
          <Marker
            latitude={state.draft.latitude}
            longitude={state.draft.longitude}
            offsetLeft={-19}
            offsetTop={-37}
          >
            <PinIcon size={40} color='hotpink' />
          </Marker>
        )}

        {/* Created Pins */}
        {state.pins.map((pin) => (
          <Marker
            key={pin._id}
            latitude={pin.latitude}
            longitude={pin.longitude}
            offsetLeft={-19}
            offsetTop={-37}
          >
            <PinIcon
              onClick={() => {
                // onClick param is eventt
                handleSelectPin(pin);
              }}
              size={40}
              color={highlightNewPin(pin)}
            />
          </Marker>
        ))}

        {/* Popup Dialog for CreatedPins */}
        {popup && (
          <Popup
            anchor='top'
            latitude={popup.latitude}
            longitude={popup.longitude}
            closeOnClick={false}
            onClose={() => setPopup(null)}
          >
            <img
              className={classes.popupImage}
              src={popup.image}
              alt={popup.title}
            />
            <div className={classes.popupTab}>
              <Typography>
                {popup.latitude.toFixed(6)}, {popup.longitude.toFixed(6)}
              </Typography>
              {isAuthUser() && (
                <Button onClick={() => handleDeletePin(popup)}>
                  <DeleteIcon className={classes.deleteIcon} />
                </Button>
              )}
            </div>
          </Popup>
        )}
      </MapGL>

      {/* Subscription for creating / updating / deleting pins */}
      <Subscription
        subscription={PIN_ADDED_SUBSCRIPTION}
        onSubscriptionData={({ subscriptionData }) => {
          const { pinAdded } = subscriptionData.data;
          dispatch({ type: 'CREATE_PIN', payload: pinAdded });
        }}
      />

      <Subscription
        subscription={PIN_DELETED_SUBSCRIPTION}
        onSubscriptionData={({ subscriptionData }) => {
          const { pinDeleted } = subscriptionData.data;
          dispatch({ type: 'DELETE_PIN', payload: pinDeleted });
        }}
      />

      <Subscription
        subscription={PIN_UPDATED_SUBSCRIPTION}
        onSubscriptionData={({ subscriptionData }) => {
          const { pinUpdated } = subscriptionData.data;
          dispatch({ type: 'CREATE_COMMENT', payload: pinUpdated });
        }}
      />

      {/* Blog Area to add Pin Content*/}
      <Blog />
    </div>
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
