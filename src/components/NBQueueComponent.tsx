import {
     Button,
     CssBaseline,
     Dialog,
     DialogActions,
     DialogContent,
     DialogContentText,
     DialogProps,
     DialogTitle,
     FormControl,
     InputLabel,
     MenuItem,
     Select,
     SelectChangeEvent,
     TextField
} from '@mui/material';
import React, { useEffect } from 'react';
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
     const [kernels, setKernels] = React.useState<any[]>([]);
     const [kernel, setKernel] = React.useState<string>('');
     const [condas, setCondas] = React.useState<any[]>([]);
     const [conda, setConda] = React.useState<string>('');
     const [fullWidth] = React.useState(true);
     const [maxWidth] = React.useState<DialogProps['maxWidth']>('md');

     const handleCondaChange = (event: SelectChangeEvent) => {
          setConda(event.target.value as string);
     };

     const handleKernelChange = (event: SelectChangeEvent) => {
          setKernel(event.target.value as string);
     };

     const handleClose = () => {
          setOpen(false);
     };

     useEffect(() => {
          getKernels();
          getCondaEnvs();
     }, []);

     const getKernels = async (): Promise<void> => {
          const response = await requestAPI<any>('kernels');
          setKernels(Object.keys(response.kernelspecs));
     };

     const getCondaEnvs = async (): Promise<void> => {
          const response = await requestAPI<any>('conda');
          setCondas(response.envs);
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
                              console.log(conda);
                              console.log(kernel);
                              console.log(formJson);

                              Notification.promise(
                                   requestAPI<any>('workflow', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                             file,
                                             cpu: formJson['cpu-number'],
                                             ram: formJson['ram-number'],
                                             bucket,
                                             conda,
                                             kernel
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
                              type="number"
                              defaultValue="2"
                              label="CPU"
                              InputLabelProps={{
                                   shrink: true
                              }}
                              variant="standard"
                              margin="dense"
                              fullWidth
                              autoFocus
                         />
                         <TextField
                              required
                              id="ram-number"
                              name="ram-number"
                              type="number"
                              defaultValue="2"
                              label="RAM"
                              InputLabelProps={{
                                   shrink: true
                              }}
                              variant="standard"
                              margin="dense"
                              fullWidth
                         />
                         <FormControl required fullWidth variant="standard">
                              <InputLabel id="conda-env">Conda Environment</InputLabel>
                              <Select
                                   labelId="conda-env"
                                   id="conda-env"
                                   value={conda}
                                   label="Conda env"
                                   onChange={handleCondaChange}
                              >
                                   {condas.map(condaEnv => (
                                        <MenuItem value={condaEnv}>{condaEnv}</MenuItem>
                                   ))}
                              </Select>
                         </FormControl>
                         <FormControl required fullWidth variant="standard">
                              <InputLabel id="kernel">Kernel</InputLabel>
                              <Select
                                   labelId="kernel"
                                   id="kernel"
                                   value={kernel}
                                   label="Kernel"
                                   onChange={handleKernelChange}
                              >
                                   {kernels.map(kernelenv => (
                                        <MenuItem value={kernelenv}>{kernelenv}</MenuItem>
                                   ))}
                              </Select>
                         </FormControl>
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
