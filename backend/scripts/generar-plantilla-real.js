const xlsx = require('xlsx');

// Mock data with real emails from the user
const data = [
  { Cedula: 'V-11111111', Nombre: 'Barbara', Apellido: 'Briceno', Correo: 'barbarabriceno11@gmail.com' },
  { Cedula: 'V-22222222', Nombre: 'Barbara', Apellido: 'Une', Correo: 'barbarabricenoune@gmail.com' },
  { Cedula: 'V-33333333', Nombre: 'Brice', Apellido: 'Miro', Correo: 'bricemiro@gmail.com' }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, 'Profesores');

xlsx.writeFile(workbook, 'PlantillaRealProfesores.xlsx');
console.log('Archivo PlantillaRealProfesores.xlsx generado correctamente');
