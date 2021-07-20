%{
#include <stdio.h>
#include <stdlib.h>

int vertexNo = 0;
int faceNo = 0;
int vertexPropertiesNo = 0;

int x = -1;
int y = -1;
int z = -1;
int nx = -1;
int ny = -1;
int nz = -1;
int red = -1;
int green = -1;
int blue = -1;
int alpha = -1;
int s = -1;
int t = -1;

int yylex(void);
void yyerror(char *);
%}

%token PLY
%token END_HEADER
%token VALID_FORMAT
%token COMMENT
%token ELEMENT
%token PROPERTY
%token CHAR
%token UCHAR
%token SHORT
%token USHORT
%token INT
%token UINT
%token FLOAT
%token DOUBLE
%token LIST
%token VERTEX
%token FACE
%token VERTEX_INDICES
%token X
%token Y
%token Z
%token NX
%token NY
%token NZ
%token RED
%token GREEN
%token BLUE
%token ALPHA
%token S
%token T
%token INT_LITERAL
%token FLOAT_LITERAL

%%

file:   header elementList
    ;

header: PLY VALID_FORMAT header_contents END_HEADER
    ;

header_contents:    header_contents header_statement
                |   header_statement
                |
                ;

header_statement:   COMMENT
                |   element_definition
                ;

element_definition: vertex_definition
                |   face_definition
                ;

vertex_definition:  ELEMENT VERTEX INT_LITERAL vertex_properties {

    vertexNo = $3;
}
                ;

vertex_properties:  vertex_properties vertex_property
                |   vertex_property
                |
                ;

vertex_property:    PROPERTY number_type X      { x = vertexPropertiesNo++; }
                |   PROPERTY number_type Y      { y = vertexPropertiesNo++; }
                |   PROPERTY number_type Z      { z = vertexPropertiesNo++; }
                |   PROPERTY number_type NX     { nx = vertexPropertiesNo++; }
                |   PROPERTY number_type NY     { ny = vertexPropertiesNo++; }
                |   PROPERTY number_type NZ     { nz = vertexPropertiesNo++; }
                |   PROPERTY number_type S      { s = vertexPropertiesNo++; }
                |   PROPERTY number_type T      { t = vertexPropertiesNo++; }
                |   PROPERTY number_type RED    { red = vertexPropertiesNo++; }
                |   PROPERTY number_type GREEN  { green = vertexPropertiesNo++; }
                |   PROPERTY number_type BLUE   { blue = vertexPropertiesNo++; }
                |   PROPERTY number_type ALPHA  { alpha = vertexPropertiesNo++; }
                ;

face_definition:    ELEMENT FACE INT_LITERAL face_property {

    faceNo = $3;
}
                ;

face_property:  PROPERTY LIST unsigned_type number_type VERTEX_INDICES
            |
            ;

number_type:    CHAR | UCHAR | SHORT | USHORT | INT | UINT | FLOAT | DOUBLE
            ;

unsigned_type:  UCHAR | USHORT | UINT
            ;

elementList:    elementList number
            |   number
            |
            ;

number: INT_LITERAL | FLOAT_LITERAL
    ;

%%

void yyerror(char *s)
{
    fprintf(stderr, "%s: Line: \n", s);
}

int main(void)
{
    yyparse();

    fprintf(stderr, "Number of vertices: %i\n", vertexNo);
    fprintf(stderr, "Number of properties per vertex: %i\n", vertexPropertiesNo);
    fprintf(stderr, "Number of faces: %i\n", faceNo);

    fprintf(stderr, "Order of x property: %i\n", x);
    fprintf(stderr, "Order of y property: %i\n", y);
    fprintf(stderr, "Order of z property: %i\n", z);
    fprintf(stderr, "Order of nx property: %i\n", nx);
    fprintf(stderr, "Order of ny property: %i\n", ny);
    fprintf(stderr, "Order of nz property: %i\n", nz);
    fprintf(stderr, "Order of s property: %i\n", s);
    fprintf(stderr, "Order of t property: %i\n", t);
    fprintf(stderr, "Order of red property: %i\n", red);
    fprintf(stderr, "Order of green property: %i\n", green);
    fprintf(stderr, "Order of blue property: %i\n", blue);
    fprintf(stderr, "Order of alpha property: %i\n", alpha);

    return 0;
}