import {
     Button,
     CssBaseline,
     Dialog,
     DialogActions,
     DialogContent,
     DialogContentText,
     DialogProps,
     DialogTitle,
     TextField
} from '@mui/material';
import React from 'react';
import { requestAPI } from '../handler';
import { Notification } from '@jupyterlab/apputils';

interface NBQueueComponentProps {
     file: string;
     bucket: string;
}

const NBQueueComponent: React.FC<NBQueueComponentProps> = (
     props
): JSX.Element => {
     const [open, setOpen] = React.useState(true);
     // const [image, setImage] = React.useState('image01');
     const [file] = React.useState(props.file);
     const [bucket] = React.useState(props.bucket);
     const [fullWidth] = React.useState(true);
     const [maxWidth] = React.useState<DialogProps['maxWidth']>('md');

     const handleClose = () => {
          setOpen(false);
     };

     return (
          <React.Fragment>
               <Dialog
                    open={open}
                    onClose={handleClose}
                    fullWidth={fullWidth}
                    maxWidth={maxWidth}
                    PaperProps={{
                         component: 'form',
                         onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
                              event.preventDefault();
                              const formData = new FormData(event.currentTarget);
                              const formJson = Object.fromEntries((formData as any).entries());
                              console.log(formJson);

                              Notification.promise(
                                   requestAPI<any>('workflow', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                             file,
                                             cpu: formJson['cpu-number'],
                                             ram: formJson['ram-number'],
                                             bucket,
                                             conda: formJson['conda-environment'],
                                             container: formJson['container-image'],
                                        })
                                   }),
                                   {
                                        pending: {
                                             message: 'Sendind files to AWS',
                                             options: { autoClose: 3000 }
                                        },
                                        /**
                                         * If not set `options.data` will be set to the promise result.
                                         */
                                        success: {
                                             message: (result, data) => 'Files sent successfully',
                                             options: { autoClose: 3000 }
                                        },
                                        /**
                                         * If not set `options.data` will be set to the promise rejection error.
                                         */
                                        error: {
                                             message: (reason, data) =>
                                                  `Error sending files. Reason: ${reason}`,
                                             options: { autoClose: 3000 }
                                        }
                                   }
                              );

                              handleClose();
                         }
                    }}
               >
                    <DialogTitle>Parameters</DialogTitle>
                    <DialogContent>
                         <DialogContentText>
                              Please fill the form with your parameters.
                         </DialogContentText>
                         <TextField
                              required
                              id="cpu-number"
                              name="cpu-number"
                              defaultValue="1"
                              label="CPU"
                              variant="standard"
                              margin="dense"
                              fullWidth
                              autoFocus
                         />
                         <TextField
                              required
                              id="ram-number"
                              name="ram-number"
                              defaultValue="4"
                              label="RAM"
                              variant="standard"
                              margin="dense"
                              fullWidth
                         />
                         <TextField
                              id="container-image"
                              name="container-image"
                              label="Container Image"
                              variant="standard"
                              margin="dense"
                              fullWidth
                         />
                         <TextField
                              id="conda-environment"
                              name="conda-environment"
                              label="Conda environment"
                              variant="standard"
                              margin="dense"
                              fullWidth
                         />
                    </DialogContent>
                    <DialogActions>
                         <Button onClick={handleClose}>Cancel</Button>
                         <Button type="submit">Send</Button>
                    </DialogActions>
               </Dialog>
          </React.Fragment>
     );
};

export default NBQueueComponent;
<CssBaseline />;
