import { Entity, Property } from '@mikro-orm/core';
import { BaseEntity } from '../shared/db/base.entity.js';

@Entity({ abstract: true })
export abstract class Persona extends BaseEntity {
    @Property({ type: 'string' })
    nombre!: string;

    @Property({ type: 'string' })
    apellido!: string;

    @Property({ type: 'string' })
    email!: string;

    @Property({ type: 'string' })
    contrasenia!: string;

    @Property({ type: 'int' })
    nivel_permisos!: number;

    @Property({ type: 'boolean' })
    estado!: boolean;
}