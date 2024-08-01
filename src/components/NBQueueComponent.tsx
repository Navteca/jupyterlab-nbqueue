import { Button, CssBaseline, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material'
import React from 'react'
import { requestAPI } from '../handler';

interface NBQueueComponentProps {
     file: string
}

const NBQueueComponent: React.FC<NBQueueComponentProps> = (props): JSX.Element => {
     const [open, setOpen] = React.useState(true);
     const [image, setImage] = React.useState('image01');
     const [file] = React.useState(props.file);
     const [images] = React.useState([
          {
               id: 'image01',
               name: 'Image 01'
          },
          {
               id: 'image02',
               name: 'Image 02'
          },
          {
               id: 'image03',
               name: 'Image 03'
          }
     ]);

     const handleChange = (event: SelectChangeEvent) => {
          setImage(event.target.value as string);
     };

     const handleClose = () => {
          setOpen(false);
     };

     const handleSubmit = async () => {
          const response = await requestAPI<any>('nbqueue/submit', {
               method: 'POST',
               body: JSON.stringify({
                    file
               })
          })

          console.log(response)

          setOpen(false);
     };

     return (
          <React.Fragment>
               <Dialog
                    open={open}
                    onClose={handleClose}
                    PaperProps={{
                         component: 'form',
                         onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                              event.preventDefault();
                              const formData = new FormData(event.currentTarget);
                              const formJson = Object.fromEntries((formData as any).entries());
                              const email = formJson.email;
                              console.log(email);
                              handleClose();
                         },
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
                                   shrink: true,
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
                                   shrink: true,
                              }}
                              variant="standard"
                              margin="dense"
                              fullWidth
                         />
                         <FormControl fullWidth variant="standard">
                              <InputLabel id="image-name">Image</InputLabel>
                              <Select
                                   required
                                   labelId="image-name"
                                   id="image-name"
                                   value={image}
                                   label="Image"
                                   onChange={handleChange}
                              >
                                   {images.map(img => <MenuItem value={img.id}>{img.name}</MenuItem>)}
                              </Select>
                         </FormControl>
                    </DialogContent>
                    <DialogActions>
                         <Button onClick={handleClose}>Cancel</Button>
                         <Button onClick={handleSubmit}>Send</Button>
                    </DialogActions>
               </Dialog>
          </React.Fragment >
     );
}

export default NBQueueComponent;
<CssBaseline />