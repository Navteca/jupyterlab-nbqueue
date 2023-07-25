import React, { useEffect, useContext } from 'react';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import { RunComponent } from './RunComponent';
import { RunContext } from './RunsContext';
import { RunContextType } from './runs';

export const RunsPanelComponent: React.FC = (): JSX.Element => {
  const { getRunsList, deleteRunFromList, runs } = useContext(
    RunContext
  ) as RunContextType;

  const handleContextMenuClick = (event: any) => {
    setTimeout(() => {
      getRunsList();
    }, 1000);
  };

  useEffect(() => {
    window.addEventListener('nbqueueRun', handleContextMenuClick);
    getRunsList();
    return () => {
      window.removeEventListener('nbqueueRun', handleContextMenuClick);
    };
  }, []);

  const handleDelete = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    deleteRunFromList({ deleteAll: true });
    getRunsList();
  };

  const clearListTooltip = <Tooltip id="clear-list">Clear all</Tooltip>;
  const refreshTooltip = <Tooltip id="refresh">Refresh</Tooltip>;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      <Stack gap={2} direction="horizontal">
        <h4>NBQueue history</h4>
        <span style={{ flex: '1 1 auto' }}></span>
        <ButtonGroup className="p-2" aria-label="Runs Utilities">
          <OverlayTrigger placement="bottom" overlay={clearListTooltip}>
            <Button
              variant="link"
              size="sm"
              onClick={e => handleDelete(e)}
              disabled={!!(runs.length === 0)}
            >
              <i
                className="fa fa-solid fa-trash-list m-2 fa-lg"
                aria-hidden="true"
              ></i>
            </Button>
          </OverlayTrigger>
          <OverlayTrigger placement="bottom" overlay={refreshTooltip}>
            <Button variant="link" size="sm" onClick={getRunsList}>
              <i
                className="fa fa-solid fa-arrows-rotate m-2 fa-lg"
                aria-hidden="true"
              ></i>
            </Button>
          </OverlayTrigger>
        </ButtonGroup>
      </Stack>
      <div>
        {runs.map(run => {
          return <RunComponent key={run.pid} run={run} />;
        })}
      </div>
    </div>
  );
};
