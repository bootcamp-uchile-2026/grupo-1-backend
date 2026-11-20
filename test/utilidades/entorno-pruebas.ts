import { exigirLaboratorio } from './guardia-laboratorio';
import { randomBytes } from 'node:crypto';

// Secreto efimero solo para la suite: nunca se usa fuera de los tests.
process.env.JWT_SECRET ??= randomBytes(32).toString('hex');

exigirLaboratorio();
