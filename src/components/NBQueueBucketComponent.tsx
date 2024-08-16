import { IStateDB } from '@jupyterlab/statedb';
import { Button, CssBaseline, Dialog, DialogActions, DialogContent, DialogProps, DialogTitle, TextField } from '@mui/material'
import React from 'react'
// import { ReadonlyJSONObject } from '@lumino/coreutils';

const NBQueueBucketComponent: React.FC = (): JSX.Element => {
     const [open, setOpen] = React.useState(true);
     const [fullWidth] = React.useState(true);
     const [maxWidth] = React.useState<DialogProps['maxWidth']>('sm');

     const handleClose = () => {
          setOpen(false);
     };

     const handleSubmit = async () => {
          console.log('handleSubmit')

          setOpen(false);
     };


     const promise1 = Promise.resolve(123);

     let state: IStateDB
     promise1.then(() => state.fetch('jupyterlab-nbqueue:plugin'))
     .then(value => {
       console.log(value);
     });

     return (
          <React.Fragment>
               <Dialog
                    open={open}
                    onClose={handleClose}
                    PaperProps={{
                         component: 'form',
                    }}
                    fullWidth={fullWidth}
                    maxWidth={maxWidth}
               >
                    <DialogTitle>NBQueue settting</DialogTitle>
                    <DialogContent>
                         <TextField
                              required
                              id="bucket-name"
                              name="bucket-name"
                              type="text"
                              defaultValue=""
                              label="Bucket Name"
                              variant="standard"
                              margin="dense"
                              fullWidth
                              autoFocus
                         />
                    </DialogContent>
                    <DialogActions>
                         <Button onClick={handleClose}>Cancel</Button>
                         <Button onClick={handleSubmit}>Send</Button>
                    </DialogActions>
               </Dialog>
          </React.Fragment >
     );
}

export default NBQueueBucketComponent;
<CssBaseline />