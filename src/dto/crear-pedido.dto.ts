import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateNested,
} from 'class-validator';

/**
 * DTO de ENTRADA.
 * Datos de contacto de quien recibe el pedido.
 */
export class ContactoPedidoDto {
  @ApiProperty({
    type: String,
    description: 'Nombre de quien recibe el pedido.',
    example: 'Fernanda Rojas',
  })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({
    type: String,
    description: 'Correo electronico de contacto.',
    example: 'cliente@stylenow.cl',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    type: String,
    description: 'Telefono de contacto.',
    example: '+56912345678',
  })
  @IsString()
  @IsNotEmpty()
  telefono: string;
}

/**
 * DTO de ENTRADA.
 * Direccion de despacho del pedido.
 */
export class DireccionPedidoDto {
  @ApiProperty({
    type: String,
    description: 'Nombre de la calle.',
    example: 'Av. Providencia',
  })
  @IsString()
  @IsNotEmpty()
  calle: string;

  @ApiProperty({
    type: String,
    description: 'Numero de la direccion.',
    example: '1234',
  })
  @IsString()
  @IsNotEmpty()
  numero: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Departamento, oficina o casa interior.',
    example: 'Depto 502',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  departamento?: string;

  @ApiProperty({
    type: String,
    description: 'Comuna de despacho.',
    example: 'Providencia',
  })
  @IsString()
  @IsNotEmpty()
  comuna: string;

  @ApiProperty({
    type: String,
    description: 'Region de despacho.',
    example: 'Region Metropolitana',
  })
  @IsString()
  @IsNotEmpty()
  region: string;
}

/**
 * DTO de ENTRADA.
 * Datos del checkout con que se crea un pedido a partir de un carrito.
 */
export class CrearPedidoDto {
  @ApiProperty({
    type: Number,
    description: 'Identificador del carrito que se convierte en pedido.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  carritoId: number;

  @ApiProperty({
    type: ContactoPedidoDto,
    description: 'Datos de contacto de quien recibe el pedido.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => ContactoPedidoDto)
  contacto: ContactoPedidoDto;

  @ApiProperty({
    type: DireccionPedidoDto,
    description: 'Direccion de despacho del pedido.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => DireccionPedidoDto)
  direccion: DireccionPedidoDto;

  @ApiProperty({
    type: String,
    description: 'Metodo de pago elegido en el checkout.',
    example: 'webpay',
  })
  @IsString()
  @IsNotEmpty()
  metodoPago: string;
}
