/**
 * NBQueue Job Submission Component
 * 
 * React component that provides a dialog interface for submitting notebooks
 * to the execution queue with configurable parameters (CPU, RAM, container image, etc.).
 */

import {
     Button,
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
import { 
     JobSubmissionRequest, 
     JobSubmissionResponse, 
     NotebookFile,
     validateJobSubmissionRequest,
     isJobSubmissionSuccess
} from '../common/types';
import { Notification } from '@jupyterlab/apputils';

/** Props interface for the NBQueueComponent */
interface NBQueueComponentProps {
     /** File object containing notebook information */
     file: NotebookFile;
     /** Output folder path for job results */
     renderingFolder: string;
}

/**
 * Main component for job submission dialog
 * 
 * Renders a Material-UI dialog with form fields for configuring
 * notebook execution parameters and submitting to the queue.
 */
const NBQueueComponent: React.FC<NBQueueComponentProps> = (
     props
): JSX.Element => {
     // Dialog state management
     const [open, setOpen] = React.useState(true);
     const [file] = React.useState(props.file);
     const [renderingFolder] = React.useState(props.renderingFolder);
     const [fullWidth] = React.useState(true);
     const [maxWidth] = React.useState<DialogProps['maxWidth']>('md');

     /** Closes the dialog */
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
                              
                              // Extract form data
                              const formData = new FormData(event.currentTarget);
                              const formJson = Object.fromEntries((formData as any).entries());
                              console.log(formJson);

                              // Build payload for API request
                              const payload: JobSubmissionRequest = {
                                   notebook_file: file,
                                   image: formJson['container-image'],
                                   conda_env: formJson['conda-environment'],
                                   output_path: renderingFolder,
                                   cpu: formJson['cpu-number'],
                                   ram: formJson['ram-number']
                               };

                              console.log(payload);

                              // Validate payload before sending
                              if (!validateJobSubmissionRequest(payload)) {
                                   console.error('Invalid job submission payload:', payload);
                                   return;
                              }

                              // Submit job with progress notifications
                              Notification.promise(
                                   requestAPI<JobSubmissionResponse>('submit', {
                                        method: 'POST',
                                        body: JSON.stringify(payload),
                                   }),
                                   {
                                        pending: {
                                             message: 'Sending info to gRPC server',
                                        },
                                        success: {
                                             message: (result: unknown) => {
                                                  const response = result as JobSubmissionResponse;
                                                  if (isJobSubmissionSuccess(response)) {
                                                       return response.success ? 
                                                            (response.kubectl_output || 'Job submitted successfully') :
                                                            (response.error_message || 'Job submission failed');
                                                  }
                                                  return 'Job submitted successfully';
                                             },
                                             options: { autoClose: 3000 },
                                        },
                                        error: {
                                             message: (reason: any) =>
                                                  `Error sending info. Reason: ${typeof reason === 'object' && reason.error ? reason.error : reason}`,
                                             options: { autoClose: 3000 },
                                        },
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
                         
                         {/* CPU Configuration */}
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
                         
                         {/* RAM Configuration */}
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
                         
                         {/* Container Image */}
                         <TextField
                              id="container-image"
                              name="container-image"
                              label="Container Image"
                              variant="standard"
                              margin="dense"
                              fullWidth
                         />
                         
                         {/* Conda Environment */}
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
