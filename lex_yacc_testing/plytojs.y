%{
#include <stdio.h>
#include <stdlib.h>

int vertexNo = 0;
int faceNo = 0;
int vertexPropertiesNo = 0;

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

vertex_property:    PROPERTY number_type X
                |   PROPERTY number_type Y
                |   PROPERTY number_type Z
                |   PROPERTY number_type NX
                |   PROPERTY number_type NY
                |   PROPERTY number_type NZ
                |   PROPERTY number_type S
                |   PROPERTY number_type T
                |   PROPERTY number_type RED
                |   PROPERTY number_type GREEN
                |   PROPERTY number_type BLUE
                |   PROPERTY number_type ALPHA
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

    printf("Number of vertices: %i\n", vertexNo);
    printf("Number of faces: %i\n", faceNo);

    return 0;
}