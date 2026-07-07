const xlsx = require('xlsx');

const data = [
  { Cedula: 'V-11111111', Nombre: 'Juan', Apellido: 'Perez', Correo: 'juan.perez@example.com' },
  { Cedula: 'V-22222222', Nombre: 'Maria', Apellido: 'Gomez', Correo: 'maria.gomez@example.com' },
  { Cedula: 'V-33333333', Nombre: 'Carlos', Apellido: 'Rodriguez', Correo: 'carlos.rod@example.com' },
  { Cedula: 'V-44444444', Nombre: 'Ana', Apellido: 'Martinez', Correo: 'ana.martinez@example.com' },
  { Cedula: 'V-55555555', Nombre: 'Luis', Apellido: 'Fernandez', Correo: 'luis.fernandez2@example.com' }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Profesores');

xlsx.writeFile(workbook, 'PlantillaProfesores.xlsx');
console.log('Archivo PlantillaProfesores.xlsx generado correctamente en la carpeta academia-backend');
