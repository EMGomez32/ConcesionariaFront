export interface Provincia {
  id: string;
  nombre: string;
  departamentos: string[];
}

export const PROVINCIAS_ARGENTINA: Provincia[] = [
  {
    id: 'buenos-aires',
    nombre: 'Buenos Aires',
    departamentos: [
      'Adolfo Alsina', 'Adolfo Gonzales Chaves', 'Alberti', 'Almirante Brown', 'Arrecifes', 'Avellaneda',
      'Ayacucho', 'Azul', 'Bahía Blanca', 'Balcarce', 'Baradero', 'Benito Juárez', 'Berazategui', 'Berisso',
      'Bolívar', 'Bragado', 'Brandsen', 'Campana', 'Cañuelas', 'Capitán Sarmiento', 'Carlos Casares',
      'Carlos Tejedor', 'Carmen de Areco', 'Castelli', 'Colón', 'Coronel Dorrego', 'Coronel Pringles',
      'Coronel Rosales', 'Coronel Suárez', 'Chacabuco', 'Chascomús', 'Chivilcoy', 'Daireaux', 'Dolores',
      'Ensenada', 'Escobar', 'Esteban Echeverría', 'Exaltación de la Cruz', 'Ezeiza', 'Florencio Varela',
      'General Alvarado', 'General Alvear', 'General Arenales', 'General Belgrano', 'General Guido',
      'General Juan Madariaga', 'General La Madrid', 'General Las Heras', 'General Lavalle', 'General Paz',
      'General Pinto', 'General Pueyrredón', 'General Rodríguez', 'General San Martín', 'General Viamonte',
      'General Villegas', 'Guaminí', 'Hipólito Yrigoyen', 'Hurlingham', 'Ituzaingó', 'José C. Paz',
      'Junín', 'La Matanza', 'La Plata', 'Lanús', 'Laprida', 'Las Flores', 'Leandro N. Alem', 'Lincoln',
      'Lobería', 'Lobos', 'Lomas de Zamora', 'Luján', 'Magdalena', 'Maipú', 'Malvinas Argentinas',
      'Mar Chiquita', 'Marcos Paz', 'Mercedes', 'Merlo', 'Monte', 'Monte Hermoso', 'Moreno', 'Morón',
      'Navarro', 'Necochea', 'Nueve de Julio', 'Olavarría', 'Patagones', 'Pehuajó', 'Pellegrini', 'Pergamino',
      'Pila', 'Pilar', 'Pinamar', 'Presidente Perón', 'Puan', 'Punta Indio', 'Quilmes', 'Ramallo',
      'Rauch', 'Rivadavia', 'Rojas', 'Roque Pérez', 'Saavedra', 'Saladillo', 'Salliqueló', 'Salto',
      'San Andrés de Giles', 'San Antonio de Areco', 'San Cayetano', 'San Fernando', 'San Isidro',
      'San Miguel', 'San Nicolás', 'San Pedro', 'San Vicente', 'Suipacha', 'Tandil', 'Tapalqué',
      'Tigre', 'Tordillo', 'Tornquist', 'Trenque Lauquen', 'Tres Arroyos', 'Tres de Febrero',
      'Tres Lomas', 'Veinticinco de Mayo', 'Vicente López', 'Villa Gesell', 'Villarino', 'Zárate'
    ]
  },
  {
    id: 'caba',
    nombre: 'Ciudad Autónoma de Buenos Aires',
    departamentos: ['Comuna 1', 'Comuna 2', 'Comuna 3', 'Comuna 4', 'Comuna 5', 'Comuna 6', 'Comuna 7', 
                   'Comuna 8', 'Comuna 9', 'Comuna 10', 'Comuna 11', 'Comuna 12', 'Comuna 13', 'Comuna 14', 'Comuna 15']
  },
  {
    id: 'catamarca',
    nombre: 'Catamarca',
    departamentos: [
      'Ambato', 'Ancasti', 'Andalgalá', 'Antofagasta de la Sierra', 'Belén', 'Capayán',
      'Capital', 'El Alto', 'Fray Mamerto Esquiú', 'La Paz', 'Paclín', 'Pomán',
      'Santa María', 'Santa Rosa', 'Tinogasta', 'Valle Viejo'
    ]
  },
  {
    id: 'chaco',
    nombre: 'Chaco',
    departamentos: [
      'Almirante Brown', 'Bermejo', 'Chacabuco', 'Comandante Fernández', 'Doce de Octubre',
      'Dos de Abril', 'Fray Justo Santa María de Oro', 'General Belgrano', 'General Donovan',
      'General Güemes', 'Independencia', 'Libertad', 'Libertador General San Martín', 'Maipú',
      'Mayor Luis Jorge Fontana', 'Nueve de Julio', 'O\'Higgins', 'Presidencia de la Plaza',
      'Primero de Mayo', 'Quitilipi', 'San Fernando', 'San Lorenzo', 'Sargento Cabral',
      'Tapenagá', 'Veinticinco de Mayo'
    ]
  },
  {
    id: 'chubut',
    nombre: 'Chubut',
    departamentos: [
      'Biedma', 'Cushamen', 'Escalante', 'Florentino Ameghino', 'Futaleufú', 'Gaiman',
      'Gastre', 'Languiñeo', 'Mártires', 'Paso de Indios', 'Rawson', 'Río Senguer',
      'Sarmiento', 'Tehuelches', 'Telsen'
    ]
  },
  {
    id: 'cordoba',
    nombre: 'Córdoba',
    departamentos: [
      'Capital', 'Colón', 'Cruz del Eje', 'General Roca', 'General San Martín', 'Ischilín',
      'Marcos Juárez', 'Minas', 'Pocho', 'Presidente Roque Sáenz Peña', 'Punilla', 'Río Cuarto',
      'Río Primero', 'Río Seco', 'Río Segundo', 'San Alberto', 'San Javier', 'San Justo',
      'Sobremonte', 'Tercero Arriba', 'Totoral', 'Tulumba', 'Unión', 'Calamuchita'
    ]
  },
  {
    id: 'corrientes',
    nombre: 'Corrientes',
    departamentos: [
      'Bella Vista', 'Berón de Astrada', 'Capital', 'Concepción', 'Curuzú Cuatiá', 'Empedrado',
      'Esquina', 'General Alvear', 'General Paz', 'Goya', 'Itatí', 'Ituzaingó', 'Lavalle',
      'Mburucuyá', 'Mercedes', 'Monte Caseros', 'Paso de los Libres', 'Saladas', 'San Cosme',
      'San Luis del Palmar', 'San Martín', 'San Miguel', 'San Roque', 'Santo Tomé', 'Sauce'
    ]
  },
  {
    id: 'entre-rios',
    nombre: 'Entre Ríos',
    departamentos: [
      'Colón', 'Concordia', 'Diamante', 'Federación', 'Federal', 'Feliciano', 'Gualeguay',
      'Gualeguaychú', 'Islas del Ibicuy', 'La Paz', 'Nogoyá', 'Paraná', 'San Salvador',
      'Tala', 'Uruguay', 'Victoria', 'Villaguay'
    ]
  },
  {
    id: 'formosa',
    nombre: 'Formosa',
    departamentos: [
      'Bermejo', 'Formosa', 'Laishí', 'Matacos', 'Patiño', 'Pilagás', 'Pilcomayo',
      'Pirané', 'Ramón Lista'
    ]
  },
  {
    id: 'jujuy',
    nombre: 'Jujuy',
    departamentos: [
      'Cochinoca', 'Doctor Manuel Belgrano', 'El Carmen', 'Humahuaca', 'Ledesma', 'Palpalá',
      'Rinconada', 'San Antonio', 'San Pedro', 'Santa Bárbara', 'Santa Catalina',
      'Susques', 'Tilcara', 'Tumbaya', 'Valle Grande', 'Yavi'
    ]
  },
  {
    id: 'la-pampa',
    nombre: 'La Pampa',
    departamentos: [
      'Atreucó', 'Caleu Caleu', 'Capital', 'Catriló', 'Chalileo', 'Chapaleufú', 'Chical Co',
      'Conhelo', 'Curacó', 'Guatraché', 'Hucal', 'Lihuel Calel', 'Limay Mahuida', 'Loventué',
      'Maracó', 'Puelén', 'Quemú Quemú', 'Rancul', 'Realicó', 'Toay', 'Trenel', 'Utracán'
    ]
  },
  {
    id: 'la-rioja',
    nombre: 'La Rioja',
    departamentos: [
      'Arauco', 'Capital', 'Castro Barros', 'Chamical', 'Chilecito', 'Coronel Felipe Varela',
      'Famatina', 'General Ángel Vicente Peñaloza', 'General Belgrano', 'General Juan Facundo Quiroga',
      'General Lamadrid', 'General Ocampo', 'General San Martín', 'Independencia', 'Rosario Vera Peñaloza',
      'Sanagasta', 'San Blas de los Sauces', 'Vinchina'
    ]
  },
  {
    id: 'mendoza',
    nombre: 'Mendoza',
    departamentos: [
      'Capital', 'General Alvear', 'Godoy Cruz', 'Guaymallén', 'Junín', 'La Paz', 'Las Heras',
      'Lavalle', 'Luján de Cuyo', 'Maipú', 'Malargüe', 'Rivadavia', 'San Carlos', 'San Martín',
      'San Rafael', 'Santa Rosa', 'Tunuyán', 'Tupungato'
    ]
  },
  {
    id: 'misiones',
    nombre: 'Misiones',
    departamentos: [
      'Apóstoles', 'Cainguás', 'Candelaria', 'Capital', 'Concepción', 'Eldorado', 'General Manuel Belgrano',
      'Guaraní', 'Iguazú', 'Leandro N. Alem', 'Libertador General San Martín', 'Montecarlo',
      'Oberá', 'San Ignacio', 'San Javier', 'San Pedro', 'Veinticinco de Mayo'
    ]
  },
  {
    id: 'neuquen',
    nombre: 'Neuquén',
    departamentos: [
      'Aluminé', 'Añelo', 'Catán Lil', 'Chos Malal', 'Collón Curá', 'Confluencia', 'Huiliches',
      'Lácar', 'Loncopué', 'Los Lagos', 'Minas', 'Ñorquín', 'Pehuenches', 'Picún Leufú',
      'Picunches', 'Zapala'
    ]
  },
  {
    id: 'rio-negro',
    nombre: 'Río Negro',
    departamentos: [
      'Adolfo Alsina', 'Avellaneda', 'Bariloche', 'Conesa', 'El Cuy', 'General Roca',
      'Ñorquincó', 'Nueve de Julio', 'Pichi Mahuida', 'Pilcaniyeu', 'San Antonio', 'Valcheta', 'Veinticinco de Mayo'
    ]
  },
  {
    id: 'salta',
    nombre: 'Salta',
    departamentos: [
      'Anta', 'Cachi', 'Cafayate', 'Capital', 'Cerrillos', 'Chicoana', 'General Güemes',
      'General José de San Martín', 'Guachipas', 'Iruya', 'La Caldera', 'La Candelaria',
      'La Poma', 'La Viña', 'Los Andes', 'Metán', 'Molinos', 'Orán', 'Rivadavia',
      'Rosario de la Frontera', 'Rosario de Lerma', 'San Carlos', 'Santa Victoria'
    ]
  },
  {
    id: 'san-juan',
    nombre: 'San Juan',
    departamentos: [
      'Albardón', 'Angaco', 'Calingasta', 'Capital', 'Caucete', 'Chimbas', 'Iglesia',
      'Jáchal', 'Nueve de Julio', 'Pocito', 'Rawson', 'Rivadavia', 'San Martín',
      'Santa Lucía', 'Sarmiento', 'Ullum', 'Valle Fértil', 'Veinticinco de Mayo', 'Zonda'
    ]
  },
  {
    id: 'san-luis',
    nombre: 'San Luis',
    departamentos: [
      'Ayacucho', 'Belgrano', 'Coronel Pringles', 'Chacabuco', 'Gobernador Dupuy', 'Junín',
      'La Capital', 'Libertador General San Martín', 'Pedernera'
    ]
  },
  {
    id: 'santa-cruz',
    nombre: 'Santa Cruz',
    departamentos: [
      'Corpen Aike', 'Deseado', 'Güer Aike', 'Lago Argentino', 'Lago Buenos Aires',
      'Magallanes', 'Río Chico'
    ]
  },
  {
    id: 'santa-fe',
    nombre: 'Santa Fe',
    departamentos: [
      'Belgrano', 'Caseros', 'Castellanos', 'Constitución', 'Garay', 'General López',
      'General Obligado', 'Iriondo', 'La Capital', 'Las Colonias', 'Nueve de Julio',
      'Rosario', 'San Cristóbal', 'San Javier', 'San Jerónimo', 'San Justo', 'San Lorenzo',
      'San Martín', 'Vera'
    ]
  },
  {
    id: 'santiago-del-estero',
    nombre: 'Santiago del Estero',
    departamentos: [
      'Aguirre', 'Alberdi', 'Atamisqui', 'Avellaneda', 'Banda', 'Belgrano', 'Capital',
      'Choya', 'Copo', 'Figueroa', 'General Taboada', 'Guasayán', 'Jiménez', 'Juan Francisco Borges',
      'Loreto', 'Mitre', 'Moreno', 'Ojo de Agua', 'Pellegrini', 'Quebrachos', 'Río Hondo',
      'Rivadavia', 'Robles', 'Salavina', 'San Martín', 'Sarmiento', 'Silípica'
    ]
  },
  {
    id: 'tierra-del-fuego',
    nombre: 'Tierra del Fuego',
    departamentos: [
      'Río Grande', 'Tolhuin', 'Ushuaia', 'Antártida Argentina'
    ]
  },
  {
    id: 'tucuman',
    nombre: 'Tucumán',
    departamentos: [
      'Burruyacú', 'Capital', 'Chicligasta', 'Cruz Alta', 'Famaillá', 'Graneros',
      'Juan Bautista Alberdi', 'La Cocha', 'Leales', 'Lules', 'Monteros', 'Río Chico',
      'Simoca', 'Tafí del Valle', 'Tafí Viejo', 'Trancas', 'Yerba Buena'
    ]
  }
];
