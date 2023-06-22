import React, { useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import { RunContext } from './RunsContext';
import { RunContextType } from './runs';
import { IRun } from './CustomProps';
import '../../node_modules/bootstrap/dist/css/bootstrap.min.css';

interface Props {
  run: IRun;
}

export const RunComponent: React.FC<Props> = ({ run }): JSX.Element => {
  const { deleteRunFromList, getRunsList } = useContext(
    RunContext
  ) as RunContextType;
  const handleDeleteClick = async (
    event: React.MouseEvent<HTMLElement>,
    id: number,
    pid: number
  ) => {
    event.preventDefault();
    deleteRunFromList({ id, pid });
    getRunsList();
  };

  const removeFromListTooltip = (
    <Tooltip id="remove-from-list">Remove from list</Tooltip>
  );

  return (
    <div>
      <Card className="m-2">
        <Card.Body>
          <Stack gap={1} direction="horizontal">
            <Stack gap={1}>
              <span>{run.name}</span>
              <span>{run.status}</span>
            </Stack>
            <OverlayTrigger placement="bottom" overlay={removeFromListTooltip}>
              <Button
                className="ms-auto"
                variant="link"
                size="sm"
                onClick={e => handleDeleteClick(e, run.id, run.pid)}
                disabled={false}
              >
                <span
                  className="fa fa-solid fa-xmark m-2"
                  aria-hidden="true"
                ></span>
              </Button>
            </OverlayTrigger>
          </Stack>
        </Card.Body>
      </Card>
    </div>
  );
};
